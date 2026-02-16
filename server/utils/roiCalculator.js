// server/utils/roiCalculator.js
const cron = require('node-cron');
const Investment = require('../models/Investment');
const MarketEvent = require('../models/MarketEvent');
const UserGainLog = require('../models/UserGainLog');
const Config = require('../models/Config');
const User = require('../models/User');

async function runRoiSimulation() {
  try {
    console.log('[ROI SIM] Running ROI simulation cron...');
    // Load runtime config map (keys -> values)
    const configDocs = await Config.find({}).lean().exec();
    const configMap = {};
    (configDocs || []).forEach(c => { configMap[c.key] = c.value; });

    const investments = await Investment.find({ status: 'active' }).lean().exec();
    for (const investment of investments) {
      const now = new Date();
      // Simulate random fluctuation: deterministic drift + stochastic noise
      // Plan config now includes a `maxVariationPercent` allowing the final target ROI
      // to be randomized between `roi` and `roi + maxVariationPercent`.
      // Default plan settings; these can be overridden via Config entries:
      // Config keys: plan.<PlanName>.roi, plan.<PlanName>.duration, plan.<PlanName>.maxVariationPercent, plan.<PlanName>.volatility
      const PLAN_CONFIG = {
        Silver: { roi: 350, duration: 7, maxVariationPercent: 10, volatility: 0.015 },
        Gold: { roi: 450, duration: 10, maxVariationPercent: 20.99, volatility: 0.02 },
        Platinum: { roi: 550, duration: 15, maxVariationPercent: 25, volatility: 0.025 },
        Diamond: { roi: 650, duration: 21, maxVariationPercent: 30, volatility: 0.03 },
      };
      let plan = PLAN_CONFIG[investment.planName] || PLAN_CONFIG[investment.fundName];
      // Override per-plan values from configMap if present
      if (plan) {
        const pn = investment.planName;
        const cfgRoi = configMap[`plan.${pn}.roi`];
        const cfgDuration = configMap[`plan.${pn}.duration`];
        const cfgMaxVar = configMap[`plan.${pn}.maxVariationPercent`];
        const cfgVol = configMap[`plan.${pn}.volatility`];
        plan = Object.assign({}, plan, {
          roi: cfgRoi !== undefined ? Number(cfgRoi) : plan.roi,
          duration: cfgDuration !== undefined ? Number(cfgDuration) : plan.duration,
          maxVariationPercent: cfgMaxVar !== undefined ? Number(cfgMaxVar) : plan.maxVariationPercent,
          volatility: cfgVol !== undefined ? Number(cfgVol) : plan.volatility
        });
      }
      if (!plan) continue;
      if (!plan) continue;
      const totalMinutes = plan.duration * 24 * 60;
      const start = new Date(investment.startDate);
      const elapsedMinutes = Math.floor((now - start) / (1000 * 60));
      // Choose a randomized final ROI target within the plan's variation range
      const variation = plan.maxVariationPercent || 0;
      const chosenTargetRoi = plan.roi + (Math.random() * variation);
      const expectedFinalValue = investment.amount + (investment.amount * chosenTargetRoi / 100);
      // Log chosen target for observability
      console.log(`[ROI SIM] Plan ${investment.planName} chosenTargetRoi: ${chosenTargetRoi.toFixed(2)}% (base ${plan.roi}%, +${variation}%)`);
      const minutesLeft = totalMinutes - elapsedMinutes;
      // Calculate remaining ROI to reach target
      const remainingGain = expectedFinalValue - investment.currentValue;
      // Calculate intervals left
      const intervalsLeft = Math.max(Math.floor(minutesLeft / 5), 1);
      // Per-interval average deterministic drift toward the target
      const baseChange = remainingGain / intervalsLeft;

      // Per-plan volatility (% of original amount per interval) — introduces realistic up/down swings
      const PLAN_VOLATILITY = {
        Silver: 0.015,    // 1.5% per interval
        Gold: 0.02,       // 2% per interval
        Platinum: 0.025,  // 2.5% per interval
        Diamond: 0.03     // 3% per interval
      };
      const volatilityPct = PLAN_VOLATILITY[investment.planName] ?? 0.02;

      // Stochastic noise component (mean 0, symmetric): ±volatilityPct * amount
      const noise = investment.amount * volatilityPct * (Math.random() * 2 - 1);

      // Combine deterministic drift + stochastic noise so value can occasionally fall as well as rise
      let fluctuation = baseChange + noise;

      // Prevent currentValue from going negative
      if (investment.currentValue + fluctuation <= 0) {
        fluctuation = -investment.currentValue + 0.01; // leave tiny positive balance
      }

      // Do NOT stop updates when hitting the target before maturity.
      // Allow continued up/down fluctuations until the actual end date.
      // At maturity, apply a limited correction (not a forced full settle) to keep final value
      // reasonably close to the chosen target.
      const pn = investment.planName;
      // Per-step maximum change (percent of original amount), default 5%
      const maxStepPct = (configMap[`plan.${pn}.maxStepPct`] !== undefined) ? Number(configMap[`plan.${pn}.maxStepPct`]) : 0.05;
      const maxStep = investment.amount * maxStepPct;

      // If matured (past end date), apply a capped correction toward the target rather than forcing full settle
      if (minutesLeft <= 0) {
        const diff = expectedFinalValue - investment.currentValue;
        // threshold under which we consider the difference negligible (default 2% of amount)
        const settleThresholdPct = (configMap[`plan.${pn}.settleThresholdPct`] !== undefined) ? Number(configMap[`plan.${pn}.settleThresholdPct`]) : 0.02;
        const settleThreshold = investment.amount * settleThresholdPct;
        // maximum final correction we allow in one step (default 5% of amount)
        const maxFinalCorrectionPct = (configMap[`plan.${pn}.finalCorrectionPct`] !== undefined) ? Number(configMap[`plan.${pn}.finalCorrectionPct`]) : 0.05;
        const maxFinalCorrection = investment.amount * maxFinalCorrectionPct;

        if (Math.abs(diff) <= settleThreshold) {
          // small difference — don't force anything, allow final fluctuations
          console.log(`[ROI SIM] Maturity: diff ${diff.toFixed(2)} within threshold ${settleThreshold.toFixed(2)}; no forced correction.`);
        } else {
          // apply a gentle correction capped by maxFinalCorrection
          const correction = Math.max(Math.min(diff, maxFinalCorrection), -maxFinalCorrection);
          fluctuation += correction;
          console.log(`[ROI SIM] Maturity correction applied: ${correction.toFixed(2)} (diff ${diff.toFixed(2)})`);
        }
      }

      // Cap single-step change so values don't jump wildly; this avoids forcing the value back to target.
      if (fluctuation > maxStep) fluctuation = maxStep;
      if (fluctuation < -maxStep) fluctuation = -maxStep;
      // Fetch the full investment doc for update
      const invDoc = await Investment.findById(investment._id);
      invDoc.currentValue += fluctuation;
      invDoc.transactions.push({
        type: 'roi',
        amount: fluctuation,
        date: now,
        description: fluctuation >= 0 ? 'Gain' : 'Loss'
      });
      // Create UserGainLog entry
      await UserGainLog.create({
        user_id: invDoc.user,
        plan_id: invDoc.planId, // Use string planId
        gain_type: 'ROI',
        value: fluctuation,
        message: fluctuation >= 0 ? `Gain of $${fluctuation.toFixed(2)}` : `Loss of $${Math.abs(fluctuation).toFixed(2)}`,
        logged_at: now
      });
      
      // Credit ROI to user's availableBalance (positive gains only)
      if (fluctuation > 0) {
        await User.findByIdAndUpdate(invDoc.user, { $inc: { availableBalance: fluctuation } });
      }
      
      if (fluctuation >= 0) {
        console.log(`[ROI SIM][GAIN] Investment ${invDoc._id} (${invDoc.planName}): +$${fluctuation.toFixed(2)} | Current Value: $${invDoc.currentValue.toFixed(2)}`);
      } else {
        console.log(`[ROI SIM][LOSS] Investment ${invDoc._id} (${invDoc.planName}): -$${Math.abs(fluctuation).toFixed(2)} | Current Value: $${invDoc.currentValue.toFixed(2)}`);
      }
      // Mark as completed if matured
      if (minutesLeft <= 0) {
        invDoc.status = 'completed';
      }
      await invDoc.save();
    }
  } catch (err) {
    console.error('Error calculating ROI:', err.message);
  }
}

function startRoiCron() {
  cron.schedule('*/5 * * * *', async () => {
    await runRoiSimulation();
  });
  console.log('[ROI SIM] ROI simulation cron scheduled.');
}

module.exports = { startRoiCron };
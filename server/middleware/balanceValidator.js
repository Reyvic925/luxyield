const validateBalance = (balance) => {
  if (balance === undefined || balance === null) return 0;
  return parseFloat(Number(balance).toFixed(2));
};

module.exports = async function(next) {
  if (this.isModified('balance')) {
    this.balance = validateBalance(this.balance);
  }
  if (this.isModified('availableBalance')) {
    this.availableBalance = validateBalance(this.availableBalance);
  }
  next();
};
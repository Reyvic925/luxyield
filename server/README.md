# LuxYield Backend Server

## Email Configuration with Resend

### Production Setup

1. **Get Resend API Key**:
   - Go to [Resend Dashboard](https://resend.com)
   - Create a new API key specifically for production
   - Never use development keys in production

2. **Configure in Render**:
   - Go to your service dashboard in Render
   - Click on "Environment"
   - Add environment variable:
     ```
     RESEND_API_KEY=re_xxxx_your_production_key_here
     ```
   - Click "Save Changes"

3. **Verify Setup**:
   ```bash
   # Run the email test endpoint
   curl https://api.luxyield.com/api/test/email
   ```

4. **Key Rotation**:
   - Create a new API key in Resend dashboard
   - Add new key to Render environment variables
   - Wait for deployment to complete
   - Test email functionality
   - Delete old API key from Resend dashboard

### Troubleshooting

1. Check server logs in Render dashboard for any email-related errors
2. Verify environment variables are set correctly
3. Test email functionality after each deployment
4. Monitor Resend dashboard for delivery status

### Security Best Practices

1. Use different API keys for development and production
2. Rotate production API keys every 90 days
3. Never commit API keys to source control
4. Monitor email sending patterns for unusual activity
5. Set up email sending alerts in Resend dashboard

### Development Setup

1. Copy `.env.example` to `.env`
2. Add your development Resend API key
3. Use `npm run dev` for local development

## Environment Variables

See `.env.example` for all required environment variables and their descriptions.
# Paystack Integration Setup Guide

This application includes comprehensive Paystack integration for:
- Online card payments via Supabase Edge Functions
- Dedicated Virtual Accounts for automatic wallet funding via bank transfers

## Prerequisites

1. A Paystack account (sign up at https://paystack.com)
2. Access to your Supabase project dashboard

## Setup Instructions

### Step 1: Get Your Paystack Secret Key

1. Log in to your Paystack Dashboard at https://dashboard.paystack.com
2. Navigate to **Settings** > **API Keys & Webhooks**
3. Copy your **Secret Key** (starts with `sk_test_` for test mode or `sk_live_` for production)

### Step 2: Configure Paystack Secret in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** > **Secrets**
3. Add a new secret:
   - **Name**: `PAYSTACK_SECRET_KEY`
   - **Value**: Paste your Paystack secret key from Step 1

### Step 3: Test the Integration

1. Open the app and navigate to your wallet
2. Click on **Fund Wallet**
3. Enter an amount (minimum ₦100)
4. Click **Pay Online (Paystack)**
5. Complete the test payment using Paystack test cards

## Paystack Test Cards

For testing in development mode, use these test cards:

### Successful Payment
- **Card Number**: 4084 0840 8408 4081
- **CVV**: 408
- **Expiry**: Any future date
- **PIN**: 0000
- **OTP**: 123456

### Card requiring OTP
- **Card Number**: 5060 6666 6666 6666 666
- **CVV**: Any 3 digits
- **Expiry**: Any future date
- **OTP**: 123456

## Dedicated Virtual Accounts

### What are Virtual Accounts?

Dedicated Virtual Accounts (DVA) provide each user with a unique bank account number linked to their wallet. Users can fund their wallet by transferring money from any bank to this account number, and the wallet is credited automatically.

### Setting Up Virtual Accounts

1. **Automatic Setup**: Virtual accounts are created on-demand when a user clicks "Create Virtual Account" in the wallet section
2. **No Manual Configuration**: The system handles everything automatically via Paystack API
3. **Instant Activation**: Once created, the account is ready to receive transfers immediately

### Using Virtual Accounts

1. Navigate to your wallet in the app
2. If you don't have a virtual account, click "Create Virtual Account"
3. Your dedicated account details will be displayed (Bank Name, Account Number, Account Name)
4. Transfer money from any bank to this account number
5. Your wallet will be credited automatically within seconds

### Setting Up Webhook (Required for Virtual Accounts)

For automatic wallet crediting to work, you must configure the Paystack webhook:

1. Go to your Paystack Dashboard at https://dashboard.paystack.com
2. Navigate to **Settings** > **API Keys & Webhooks**
3. Scroll down to the **Webhooks** section
4. Click on **Add Webhook URL**
5. Enter your webhook URL: `https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/functions/v1/paystack-webhook`
   - Replace `[YOUR-SUPABASE-PROJECT-REF]` with your actual Supabase project reference
   - You can find this in your Supabase dashboard URL or project settings
6. Click **Add**
7. The webhook will now send payment notifications to your app

**Important**: Without setting up the webhook, automatic wallet crediting will not work, and transfers will not be reflected in user wallets.

## How It Works

### Payment Flow

1. **Initialization**: When a user clicks "Pay Online", the app calls the `initialize-payment` edge function
2. **Payment Page**: User is redirected to Paystack's secure payment page in a WebView
3. **Payment Processing**: User completes payment using their card or other payment methods
4. **Verification**: After payment, Paystack redirects to the `verify-payment` edge function
5. **Wallet Credit**: Upon successful verification, the user's wallet is automatically credited

### Security Features

- API keys are never exposed to the client
- All payment operations happen on secure edge functions
- Payment verification happens server-side
- Duplicate payment prevention (same reference can't be credited twice)
- User authentication required for all payment operations

### Virtual Account Flow

1. **Account Creation**: User clicks "Create Virtual Account" button
2. **Customer Creation**: System creates or fetches Paystack customer
3. **DVA Assignment**: Paystack assigns a dedicated account number to the customer
4. **Storage**: Account details are saved to the database
5. **Bank Transfer**: User transfers money from any bank to their virtual account
6. **Webhook Notification**: Paystack sends a webhook to the app when transfer is received
7. **Auto-Credit**: System automatically credits user's wallet with the transferred amount

## Edge Functions

The integration uses four edge functions:

### 1. initialize-payment
- **Purpose**: Creates a payment transaction with Paystack
- **Authentication**: Required (JWT)
- **Input**: `{ amount: number, email: string }`
- **Output**: `{ authorization_url: string, access_code: string, reference: string }`

### 2. verify-payment
- **Purpose**: Verifies payment status and credits wallet
- **Authentication**: Not required (Paystack callback)
- **Input**: `reference` (query parameter)
- **Output**: `{ success: boolean, amount: number, reference: string }`

### 3. create-virtual-account
- **Purpose**: Creates a dedicated virtual account for a user
- **Authentication**: Required (JWT)
- **Input**: None (uses authenticated user's details)
- **Output**: `{ success: boolean, data: VirtualAccount }`
- **Process**:
  1. Checks if user already has a virtual account
  2. Creates or fetches Paystack customer
  3. Requests dedicated virtual account from Paystack
  4. Saves account details to database

### 4. paystack-webhook
- **Purpose**: Handles payment notifications from Paystack
- **Authentication**: Verified via Paystack signature
- **Input**: Paystack webhook event
- **Output**: `{ message: string }`
- **Events Handled**:
  - `charge.success`: Credits wallet when transfer is received
  - `dedicatedaccount.assign.success`: Updates account assignment status

## Troubleshooting

### Payment Not Reflecting in Wallet

1. Check if payment was successful in Paystack dashboard
2. Look for the transaction reference in `wallet_transactions` table
3. Check edge function logs in Supabase dashboard

### Virtual Account Transfer Not Crediting Wallet

1. **Check Webhook Setup**:
   - Verify webhook URL is correctly configured in Paystack dashboard
   - Ensure webhook URL is active and receiving requests
   - Check webhook logs in Paystack dashboard for errors

2. **Check Transfer Status**:
   - Verify transfer was successful in your bank app
   - Check Paystack dashboard for the transaction
   - Look for the transaction in `wallet_transactions` table

3. **Check Edge Function Logs**:
   - Go to Supabase dashboard > Edge Functions > paystack-webhook
   - Check logs for any errors during webhook processing
   - Verify the webhook signature was validated successfully

### Virtual Account Creation Fails

1. **Check Paystack Account Status**:
   - Ensure your Paystack account is fully verified
   - Verify you're using the correct API keys
   - Check if virtual accounts feature is enabled for your account

2. **Check Error Messages**:
   - Look at browser console for specific error messages
   - Check Supabase edge function logs for detailed errors
   - Contact Paystack support if issue persists

### "Paystack secret key not configured" Error

- Ensure you've added the `PAYSTACK_SECRET_KEY` secret in Supabase Edge Functions settings
- Verify the secret name is exactly `PAYSTACK_SECRET_KEY` (case-sensitive)

### Payment Stuck on Loading

- Check your internet connection
- Verify the edge functions are deployed and active
- Check browser console for any CORS or network errors

### Duplicate Account Number

- Each user can only have one virtual account
- If you see an error about existing account, the function will return the existing account details
- This is normal behavior and prevents duplicate accounts

## Production Checklist

Before going live with real payments:

1. **Switch to Live Mode**:
   - Get your live API key from Paystack dashboard (starts with `sk_live_`)
   - Update the `PAYSTACK_SECRET_KEY` in Supabase Edge Functions to use live key
   - Ensure your Paystack account is fully verified for live transactions

2. **Configure Webhook**:
   - Add webhook URL in Paystack dashboard for live mode
   - Test webhook by making a small transfer to a test virtual account
   - Verify wallet is credited automatically

3. **Test Virtual Accounts**:
   - Create a virtual account in production
   - Make a small test transfer (₦100-500)
   - Confirm wallet credit happens automatically
   - Check transaction appears in wallet history

4. **Test Card Payments**:
   - Test card payment with small amounts
   - Verify payment success and wallet credit
   - Check transaction history

5. **Monitoring & Logging**:
   - Enable proper error monitoring and logging
   - Monitor edge function logs regularly
   - Set up alerts for failed transactions

6. **User Testing**:
   - Have a few trusted users test the system
   - Gather feedback on payment experience
   - Fix any issues before full launch

## Support

- Paystack Documentation: https://paystack.com/docs
- Paystack Support: support@paystack.com
- Supabase Edge Functions: https://supabase.com/docs/guides/functions

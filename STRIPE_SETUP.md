# Stripe Setup Guide

This guide explains how to properly configure Stripe for ByteDialogue.

## 🔑 Getting Your Stripe Credentials

### 1. Stripe Secret Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy your **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for production)
4. Add to `.env.local`:
   ```env
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   ```

### 2. Stripe Price ID (Important!)

⚠️ **Common Mistake**: Using a Product ID instead of a Price ID

- ❌ **Product ID** starts with `prod_` (e.g., `prod_TVa878FHljzWbK`)
- ✅ **Price ID** starts with `price_` (e.g., `price_1234567890abcdef`)

**How to get the correct Price ID:**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → Click on your product
3. Scroll down to the **Pricing** section
4. You'll see one or more prices listed
5. Click on the **Price ID** (starts with `price_`) to copy it
6. Add to `.env.local`:
   ```env
   STRIPE_PRICE_ID=price_your_price_id_here
   ```

**Visual Guide:**
```
Stripe Dashboard
├── Products
    └── Your Product Name
        └── Pricing Section
            └── Price ID: price_1234567890abcdef  ← Copy THIS
```

### 3. App URL

Make sure your app URL has a proper scheme:

```env
# For local development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

⚠️ **Important**: The URL must start with `http://` or `https://`

## 📝 Complete `.env.local` Example

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
STRIPE_PRICE_ID=price_1234567890abcdef  # NOT prod_xxx!

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Stripe Webhook Secret (for production)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## ✅ Verification

After setting up, verify your configuration:

1. **Check the format**:
   - ✅ `STRIPE_SECRET_KEY` starts with `sk_test_` or `sk_live_`
   - ✅ `STRIPE_PRICE_ID` starts with `price_` (NOT `prod_`)
   - ✅ `NEXT_PUBLIC_APP_URL` starts with `http://` or `https://`

2. **Test the billing page**:
   - Go to `/dashboard/billing`
   - Click "Upgrade to PRO"
   - You should be redirected to Stripe checkout (not see an error)

## 🐛 Troubleshooting

### Error: "No such price: 'prod_xxx'"
- **Problem**: You're using a Product ID instead of a Price ID
- **Solution**: Get the Price ID from Products → Your Product → Pricing section

### Error: "Invalid URL: An explicit scheme must be provided"
- **Problem**: `NEXT_PUBLIC_APP_URL` doesn't have `http://` or `https://`
- **Solution**: Add the scheme: `http://localhost:3000` (not just `localhost:3000`)

### Error: "Stripe is not configured"
- **Problem**: `STRIPE_SECRET_KEY` is missing
- **Solution**: Add it to `.env.local` and restart your dev server

### Error: "Stripe price ID not configured"
- **Problem**: `STRIPE_PRICE_ID` is missing
- **Solution**: Add it to `.env.local` and restart your dev server

## 🔄 After Making Changes

Always restart your development server after changing environment variables:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## 📚 Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Checkout Sessions](https://stripe.com/docs/payments/checkout)
- [Stripe Products and Prices](https://stripe.com/docs/products-prices/overview)


# 🚀 ByteDialogue – AI-Powered PDF Intelligence Platform

**ByteDialogue** is a modern full-stack SaaS platform that allows users to upload PDF documents and interact with them through a real-time AI-powered chat interface. Built with a modern technology stack, it transforms static files into searchable, interactive knowledge.

> ✨ Built with Next.js 15, tRPC, LangChain, OpenAI, Stripe, Kinde, and UploadThing.

---

## 📦 Project Status

🟢 **Active Development** — ByteDialogue is under continuous improvement. This is a personal project ideal for demonstrating full-stack capabilities.

---

## 🧩 Features

### ✅ Currently Implemented

#### 🧠 AI-Powered Document Understanding
- ✅ **Real-Time AI Chat**: Streaming API responses for dynamic chat with your documents
- ✅ **PDF Text Extraction**: Extracts and processes text from uploaded PDFs
- ✅ **Context-Aware Responses**: AI uses relevant PDF content to answer questions
- ✅ **Session-Based Memory**: Maintains conversation context during chat sessions

#### 💼 SaaS Essentials
- ✅ **Subscription Tiers**: Free & Pro plans managed via Stripe
- ✅ **Secure Authentication**: User authentication handled by Kinde
- ✅ **User Management**: Complete user registration and profile management

#### 💅 UI & UX
- ✅ **Modern Design**: Clean and modern UI built with Tailwind CSS and shadcn-ui
- ✅ **Advanced PDF Viewer**: Beautiful and highly functional PDF viewing experience
- ✅ **Optimistic UI Updates**: Instant feedback for better user experience
- ✅ **Infinite Message Loading**: Efficient data handling for performance
- ✅ **Drag-and-Drop Uploads**: Intuitive file upload functionality
- ✅ **Light/Dark Mode**: Theme toggle for user preference
- ✅ **Responsive Design**: Works seamlessly on desktop and mobile

#### ⚙️ Developer Experience
- ✅ **Fully TypeScript**: 100% written in TypeScript for type safety
- ✅ **tRPC + Zod**: Fully typed APIs with runtime validation
- ✅ **Prisma ORM**: Modern database management with PostgreSQL
- ✅ **Real-Time Streaming**: OpenAI streaming responses

### 🚧 Planned Features (2.0 Roadmap)

#### 🧠 AI Enhancements
- 🔲 Chat with multiple PDFs together
- 🔲 Instant document summarization
- 🔲 Smart follow-up suggestions
- 🔲 Voice-to-text (Whisper) support
- 🔲 Enhanced RAG-based querying with LangChain
- 🔲 Advanced AI memory with vector embeddings

#### 💼 SaaS Enhancements
- 🔲 Admin panel (`/admin`) to manage users, usage, billing
- 🔲 AI token cost tracking per user/month
- 🔲 Enhanced file size/token usage limits per plan
- 🔲 Email verification & 2FA with Kinde

#### 📈 Analytics & Monitoring
- 🔲 Analytics dashboard with charts (Recharts)
- 🔲 Active Users tracking
- 🔲 PDF Upload Trends
- 🔲 AI Token Usage by Plan
- 🔲 Revenue Metrics (via Stripe)

#### 🧪 DevOps & Deployment
- 🔲 CI/CD via GitHub Actions
- 🔲 Dockerized app
- 🔲 AWS EKS-ready Kubernetes YAMLs
- 🔲 Cloudflare CDN
- 🔲 Sentry for error tracking
- 🔲 Prometheus + Grafana for monitoring
- 🔲 Environment secrets via AWS Secrets Manager
- 🔲 Structured logging (Winston/Pino)

---

## 🛠️ Tech Stack

| Layer | Tools & Libraries |
|-------|------------------|
| **Framework** | Next.js 15.3.2 (App Router) |
| **Frontend** | React 19, Tailwind CSS, shadcn-ui, Radix UI |
| **Backend** | tRPC 11, Zod, Prisma 6 |
| **Database** | PostgreSQL (via Prisma) |
| **Auth** | Kinde 2.6.2 |
| **Payments** | Stripe 18.1.0 |
| **AI/ML** | OpenAI 4.98.0, LangChain 0.3.25 |
| **File Uploads** | UploadThing 7.7.2 |
| **Language** | TypeScript 5 |

---

## 🧑‍💻 Getting Started

### Prerequisites

- **Node.js** v18 or later
- **pnpm** (recommended) or npm/yarn
- **PostgreSQL** database (local or cloud)
- Accounts for external services (see setup guide below)

### Quick Start

1. **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd ByteDialogue
    ```

2. **Install dependencies:**
    ```bash
    pnpm install 
    ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Then fill in all required values (see [Setup Guide](#-detailed-setup-guide) below).

4. **Set up database:**
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

5. **Start development server:**
   ```bash
   pnpm dev
   ```

   Visit `http://localhost:3000`

---

## 📋 Detailed Setup Guide

### 🔐 Required Services Setup

#### 1. PostgreSQL Database

**Options:**
- **Local PostgreSQL**: Install and run locally
- **Docker**: `docker run -e POSTGRES_PASSWORD=password -p 5432:5432 postgres`
- **Cloud Providers**:
  - [Supabase](https://supabase.com) (Free tier available)
  - [Neon](https://neon.tech) (Free tier available)
  - [PlanetScale](https://planetscale.com) (Free tier available)

**Setup:**
1. Create a database
2. Copy the connection string
3. Add to `.env.local` as `DATABASE_URL`

**Example:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/bytedialogue
```

#### 2. Kinde Authentication

**Why:** User authentication and session management

**Setup:**
1. Go to [https://kinde.com](https://kinde.com)
2. Create a free account
3. Create a new application
4. Copy the following from your dashboard:
   - `KINDE_CLIENT_ID`
   - `KINDE_CLIENT_SECRET`
   - `KINDE_ISSUER_URL` (format: `https://your-project.kinde.com`)

**Add to `.env.local`:**
```env
KINDE_CLIENT_ID=your_client_id
KINDE_CLIENT_SECRET=your_client_secret
KINDE_ISSUER_URL=https://your-project.kinde.com
KINDE_SITE_URL=http://localhost:3000
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3000/dashboard
```

#### 3. UploadThing

**Why:** File storage for PDF uploads

**Setup:**
1. Go to [https://uploadthing.com](https://uploadthing.com)
2. Create a free account
3. Create a new app
4. Go to API Keys section in your dashboard
5. Generate or copy your **UPLOADTHING_TOKEN**

**Add to `.env.local`:**
```env
UPLOADTHING_TOKEN=your_uploadthing_token
```

**Note:** UploadThing now uses a single `UPLOADTHING_TOKEN` instead of the previous `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`.

#### 4. OpenAI

**Why:** AI-powered chat with PDF documents

**Setup:**
1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Create an account
3. Add billing information (required to use API)
4. Go to API Keys section
5. Create a new secret key

**Add to `.env.local`:**
```env
OPENAI_API_KEY=sk-your_openai_api_key
```

**Note:** You'll be charged per API call. Monitor your usage in the OpenAI dashboard.

#### 5. App URL Configuration

**Add to `.env.local`:**
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 💳 Optional - Stripe (For Payment Features)

**Why:** Payment processing and subscription management

**Setup:**
1. Go to [https://stripe.com](https://stripe.com)
2. Create a free account
3. Go to Developers > API keys
4. Copy your **Test mode** secret key
5. Create a product and price in Stripe dashboard
6. Copy the price ID

**For Webhooks (local development):**
    ```bash
# Install Stripe CLI, then run:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook secret it provides
```

**Add to `.env.local`:**
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_stripe_price_id
```

**Note:** Without Stripe, the app will still work but payment/subscription features won't function.

### 📝 Complete `.env.local` Template

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bytedialogue

# Kinde Auth
KINDE_CLIENT_ID=your_kinde_client_id
KINDE_CLIENT_SECRET=your_kinde_client_secret
KINDE_ISSUER_URL=https://your-project.kinde.com
KINDE_SITE_URL=http://localhost:3000
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3000/dashboard

# UploadThing
UPLOADTHING_TOKEN=your_uploadthing_token

# OpenAI
OPENAI_API_KEY=sk-your_openai_api_key

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_stripe_price_id

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 Development

### Running the Development Server

```bash
pnpm dev
```

This will start the application on `http://localhost:3000`

### Building for Production

```bash
pnpm build
```

### Starting the Production Server

```bash
pnpm start
```

### Linting

```bash
pnpm lint
```

---

## 🐛 Troubleshooting

### Database Connection Issues

- **Error:** `DATABASE_URL is not set`
  - **Solution:** Make sure `.env.local` exists and has `DATABASE_URL` set

- **Error:** `Database connection test failed`
  - **Solution:** 
    - Verify your database is running
    - Check the connection string format
    - Ensure database exists
    - Check firewall/network settings

### Authentication Issues

- **Error:** Kinde authentication not working
  - **Solution:**
    - Verify all Kinde env variables are set correctly
    - Check that `KINDE_ISSUER_URL` matches your Kinde project URL
    - Ensure redirect URLs match your app URL

### File Upload Issues

- **Error:** UploadThing errors
  - **Solution:**
    - Verify `UPLOADTHING_TOKEN` is correct
    - Check UploadThing dashboard for any errors
    - Ensure your UploadThing app is active
    - Make sure you're using the latest token from the API Keys section

### OpenAI API Issues

- **Error:** OpenAI API errors
  - **Solution:**
    - Verify API key is correct
    - Check you have billing enabled
    - Monitor usage in OpenAI dashboard
    - Check rate limits

### Stripe Issues

- **Error:** Stripe payment errors
  - **Solution:**
    - Use test mode keys for development
    - Verify webhook secret is correct
    - Ensure webhook endpoint is accessible
    - Check Stripe dashboard for events

---

## ✅ Verification Checklist

Before running the app, verify:

- [ ] All dependencies installed (`pnpm install`)
- [ ] `.env.local` file created with all required variables
- [ ] Database is running and accessible
- [ ] Prisma schema pushed to database (`pnpm prisma db push`)
- [ ] All external service accounts created
- [ ] All API keys added to `.env.local`
- [ ] App URL configured correctly

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Kinde Documentation](https://kinde.com/docs)
- [UploadThing Documentation](https://docs.uploadthing.com)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [tRPC Documentation](https://trpc.io/docs)

---

## 🎯 Minimum Setup for Local Development

**Required:**
- ✅ Database (PostgreSQL)
- ✅ Kinde (Authentication)
- ✅ UploadThing (File uploads)
- ✅ OpenAI (AI chat)

**Optional:**
- ⚠️ Stripe (Payments won't work without it, but app will run)

---

## 📬 Contact & Contributions

Feel free to fork, star, and contribute via PR.

👤 [Adarsh Kumar](https://github.com/kavyantrics)  
📧 Reach out via email or LinkedIn if you'd like to collaborate or want mentorship/help launching your own AI SaaS.

---

## 🏁 License

MIT – Do whatever you want, but give credit.

---

## 📈 Roadmap

See [FEATURE_COMPARISON.md](./FEATURE_COMPARISON.md) for a detailed comparison of current features vs planned 2.0 features.

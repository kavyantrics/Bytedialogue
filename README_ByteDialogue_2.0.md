# 🚀 ByteDialogue 2.0 – AI-Powered PDF Intelligence Platform

**ByteDialogue** is a modern full-stack SaaS platform where users can upload PDF documents and interact with them via a real-time AI chat. It transforms static files into searchable, interactive knowledge, offering a blazing-fast, developer-friendly, and production-ready experience.

> ✨ Built with Next.js 13, tRPC, LangChain, OpenAI, Pinecone, Stripe, Kinde, and deployed via Docker & EKS on AWS.

---

## 📦 Project Status

🟢 **Active Development** — ByteDialogue is under continuous improvement with DevOps CI/CD, AI features, and production-ready deployments. Ideal for demonstrating full-stack & cloud capabilities in interviews or real-world use.

---

## 🧩 Features

### 🧠 AI-Powered Document Understanding
- Chat with multiple PDFs together
- Instant document summarization
- Smart follow-up suggestions
- Voice-to-text (Whisper) support
- RAG-based querying with LangChain
- AI memory using session-based context

### 💼 SaaS Essentials
- Free & Pro Plans (Stripe integration)
- File size/token usage limits per plan
- Admin panel to manage users, usage, billing
- Email verification & 2FA with Kinde
- AI token cost tracking per user/month

### ⚙️ Developer Experience
- Built with modern **TypeScript** (strict mode)
- tRPC + Zod for fully typed APIs
- Prisma ORM with PostgreSQL
- Drag-and-drop PDF uploads (UploadThing)
- Real-time AI streaming via OpenAI

### 💅 UI & UX
- Built with **TailwindCSS + shadcn-ui**
- Responsive, animated dashboard
- Optimistic UI updates
- Toasts, modals, keyboard navigation
- Light/Dark mode toggle

### 🧪 DevOps & Deployment
- CI/CD via GitHub Actions
- Dockerized app
- AWS EKS-ready Kubernetes YAMLs
- Cloudflare CDN
- Sentry for error tracking
- Prometheus + Grafana for monitoring
- Environment secrets via AWS Secrets Manager

---

## 🛠️ Tech Stack

| Layer         | Tools & Libraries |
|---------------|------------------|
| **Frontend**  | Next.js 13, Tailwind, shadcn-ui, React Hook Form, Radix UI |
| **Backend**   | tRPC, Zod, Prisma, PostgreSQL |
| **Auth**      | Kinde |
| **Payments**  | Stripe |
| **AI/ML**     | LangChain, OpenAI GPT-4, Whisper |
| **Vector DB** | Pinecone |
| **Uploads**   | UploadThing |
| **Deployment**| Docker, GitHub Actions, AWS EKS, Cloudflare |
| **Monitoring**| Prometheus, Grafana, Sentry |
| **Logging**   | Winston/Pino |

---

## 🧑‍💻 Getting Started

### Prerequisites

- Node.js `v18+`
- pnpm (recommended)
- PostgreSQL running locally or on cloud
- Access to: Stripe, Kinde, Pinecone, OpenAI, UploadThing
- AWS CLI configured (for production)

### Installation

```bash
git clone https://github.com/yourusername/ByteDialogue.git
cd ByteDialogue
pnpm install
cp .env.example .env.local
```

### Setup Prisma

```bash
pnpm prisma generate
pnpm prisma db push
```

### Start Dev Server

```bash
pnpm dev
```

Visit `http://localhost:3001`

---

## 🚢 Production & DevOps

### Build & Start

```bash
pnpm build
pnpm start
```

### Docker Setup

```bash
docker build -t bytedialogue .
docker run -p 3001:3001 --env-file .env.production bytedialogue
```

### GitHub Actions (CI/CD)

- ✅ Lint & Test
- ✅ Docker Build & Push
- ✅ Deploy to EKS via `kubectl`
- ✅ Slack Notification on Failures

### Kubernetes (EKS) Setup

- Helm Charts in `./k8s/`
- Ingress for routing via AWS Load Balancer or Cloudflare Tunnel

---

## 🔐 Environment Variables

You'll need keys for:
- `OPENAI_API_KEY`
- `PINECONE_API_KEY`
- `KINDE_CLIENT_ID`, `KINDE_DOMAIN`, `KINDE_SECRET`
- `STRIPE_SECRET_KEY`
- `DATABASE_URL`
- `UPLOADTHING_SECRET`
- `SENTRY_DSN`

See `.env.example` for reference.

---

## 🧪 Lint & Format

```bash
pnpm lint
pnpm format
```

---

## 👨‍💼 Admin Access

Visit `/admin` (available only for role `admin`)
- Manage users, tokens, plans
- View usage analytics
- Suspend/ban user accounts
- Adjust subscription tiers

---

## 📈 Analytics Dashboard

Charts via Recharts showing:
- Active Users
- PDF Upload Trends
- AI Token Usage by Plan
- Revenue Metrics (via Stripe)

---

## 📬 Contact & Contributions

Feel free to fork, star, and contribute via PR.

👤 [Adarsh Kumar](https://github.com/kavyantrics)  
📧 Reach out via email or LinkedIn if you'd like to collaborate or want mentorship/help launching your own AI SaaS.

---

## 🏁 License

MIT – Do whatever you want, but give credit.
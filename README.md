# ByteDialogue - A Modern Fullstack SaaS Platform

ByteDialogue is a Software-as-a-Service (SaaS) platform that allows users to upload PDF documents and interact with them through an AI-powered chat interface. Built with a modern technology stack, it provides a seamless experience for managing and understanding your PDF files.

## Project Status

This is a personal project. The information below reflects its state as of the last update. *(You might want to update this section to reflect if the project is actively developed, in maintenance, or archived).*

## Features

- 🛠️ **Complete SaaS Solution**: Fully functional platform built from scratch.
- 💻 **Engaging User Interface**: Includes a beautiful landing page and a clear pricing page.
- 💳 **Subscription Tiers**: Supports Free & Pro plans managed via Stripe.
- 📄 **Advanced PDF Viewer**: Offers a beautiful and highly functional PDF viewing experience.
- 🔄 **Real-Time AI Interaction**: Streaming API responses for dynamic chat with your documents.
- 🔒 **Secure Authentication**: User authentication handled by Kinde.
- 🎨 **Modern Design**: Clean and modern UI built with shadcn-ui.
- 🚀 **Optimized User Experience**: Features like optimistic UI updates for responsiveness.
- ⚡ **Efficient Data Handling**: Infinite message loading in chat for performance.
- 📤 **Easy File Uploads**: Intuitive drag-and-drop functionality for uploading PDFs.
- ✨ **Smooth Loading**: Instant loading states to enhance user experience.
- 🔧 **Robust Backend**: Modern data fetching using tRPC with Zod for validation.
- 🧠 **AI-Powered Memory**: Utilizes LangChain for persistent AI memory regarding PDF content.
- 🌲 **Vector Storage**: Pinecone is used for efficient vector storage and retrieval for AI.
- 📊 **Database Management**: Prisma serves as the Object-Relational Mapper (ORM).
- 🔤 **Fully TypeScript**: 100% written in TypeScript for type safety and developer experience.
- 🎁 ...and much more.

## Key Technologies Used

- **Framework**: Next.js (v13.5.2)
- **API & Data Fetching**: tRPC (v10.38.4)
- **ORM**: Prisma (v5.3.1)
- **Authentication**: Kinde (v1.8.18)
- **Payments**: Stripe (v13.7.0)
- **AI**:
    - LangChain (v0.0.153)
    - OpenAI (v4.10.0)
- **Vector Database**: Pinecone (v1.0.1)
- **File Uploads**: UploadThing (v5.6.1)
- **UI**: Tailwind CSS, shadcn-ui
- **Language**: TypeScript (v5.2.2)

## Getting Started

### Prerequisites

- Node.js (version recommended by Next.js 13.5, e.g., v18.x or later)
- npm, yarn, or pnpm (pnpm is used in `pnpm-lock.yaml`)
- Access to services like Stripe, Kinde, OpenAI, Pinecone, and UploadThing with API keys configured in your environment variables (see `.env.example` if available, or you may need to create one based on how configuration is handled).
- Prisma CLI installed (`npm install -g prisma` or `pnpm add -g prisma`)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd ByteDialogue
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install 
    ```
    (or `npm install` / `yarn install` if you prefer, though `pnpm-lock.yaml` exists)

3.  **Set up environment variables:**
    Create a `.env.local` file (or `.env`) and populate it with the necessary API keys and database URLs.
    *(You may need to inspect `src/config/`, `src/lib/`, or other parts of the code to identify all required environment variables if an example file is not present).*

4.  **Database Migrations:**
    Ensure your database is running and accessible, then apply migrations:
    ```bash
    prisma generate
    prisma db push # Or prisma migrate dev
    ```
    The `postinstall` script in `package.json` already runs `prisma generate`.

### Running the Development Server

```bash
pnpm dev
```
This will start the application on `http://localhost:3001` (as specified in `package.json`).

### Building for Production

```bash
pnpm build
```

### Starting the Production Server

```bash
pnpm start
```

## Linting

To check for linting issues:
```bash
pnpm lint
```

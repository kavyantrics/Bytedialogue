# ByteDialogue Routes Reference

Complete list of all available routes in the application.

## 📄 Public Pages

### `/` (Home Page)
- **File**: `src/app/page.tsx`
- **Description**: Landing page with features, pricing info, and "Get started" button
- **Auth**: Public (redirects to dashboard if logged in)

### `/pricing`
- **File**: `src/app/pricing/page.tsx`
- **Description**: Pricing page showing Free and Pro plans
- **Auth**: Public

### `/offline`
- **File**: `src/app/offline/page.tsx`
- **Description**: Offline fallback page (for service worker)
- **Auth**: Public

---

## 🔐 Protected Pages (Require Authentication)

### `/dashboard`
- **File**: `src/app/dashboard/page.tsx`
- **Description**: Main dashboard showing user's uploaded files
- **Auth**: Required (redirects to `/auth-callback` if not logged in)
- **Features**: 
  - View all uploaded PDFs
  - Upload new files
  - Delete files
  - View usage statistics

### `/dashboard/[fileid]`
- **File**: `src/app/dashboard/[fileid]/page.tsx`
- **Description**: Individual file view with PDF viewer and chat interface
- **Auth**: Required
- **Features**:
  - PDF viewer with zoom, rotate controls
  - AI chat interface
  - Document summary
  - Follow-up suggestions

### `/dashboard/billing`
- **File**: `src/app/dashboard/billing/page.tsx`
- **Description**: Billing and subscription management page
- **Auth**: Required
- **Features**:
  - View current plan
  - Upgrade to Pro
  - Manage subscription

### `/admin`
- **File**: `src/app/admin/page.tsx`
- **Description**: Admin dashboard for managing users and viewing analytics
- **Auth**: Required + Admin role
- **Features**:
  - Analytics dashboard with charts
  - User management (search, filter, pagination)
  - Usage analytics
  - Role and status management

### `/auth-callback`
- **File**: `src/app/auth-callback/page.tsx`
- **Description**: OAuth callback handler for Kinde authentication
- **Auth**: Public (handles auth flow)
- **Query Params**: `origin` - redirects to this page after auth

---

## 🔌 API Routes

### Authentication

#### `GET /api/auth/[kindeAuth]`
- **File**: `src/app/api/auth/[kindeAuth]/route.ts`
- **Description**: Kinde authentication handler
- **Auth**: Public (handles OAuth flow)

---

### File Management

#### `GET /api/files`
- **File**: `src/app/api/files/route.ts`
- **Description**: Get all files for authenticated user
- **Auth**: Required
- **Returns**: Array of user's files

#### `GET /api/files/[id]`
- **File**: `src/app/api/files/[id]/route.ts`
- **Description**: Get specific file details
- **Auth**: Required
- **Returns**: File metadata

#### `GET /api/pdf/[id]`
- **File**: `src/app/api/pdf/[id]/route.ts`
- **Description**: Serve PDF file content
- **Auth**: Required
- **Returns**: PDF binary data

---

### File Upload

#### `POST /api/uploadthing`
- **File**: `src/app/api/uploadthing/route.ts`
- **Description**: UploadThing file upload handler
- **Auth**: Required (handled by UploadThing middleware)
- **Features**:
  - PDF upload with size limits
  - Automatic RAG processing
  - Summary generation

---

### AI & Chat

#### `POST /api/message`
- **File**: `src/app/api/message/route.ts`
- **Description**: Send message to AI chat and get streaming response
- **Auth**: Required
- **Body**: `{ fileId: string, message: string }`
- **Returns**: Streaming text response
- **Features**:
  - RAG-based context retrieval
  - Follow-up suggestions
  - Token usage tracking

#### `POST /api/summarize`
- **File**: `src/app/api/summarize/route.ts`
- **Description**: Generate document summary
- **Auth**: Required
- **Body**: `{ fileId: string }`
- **Returns**: `{ summary: string }`

#### `POST /api/transcribe`
- **File**: `src/app/api/transcribe/route.ts`
- **Description**: Transcribe audio to text using Whisper API
- **Auth**: Required
- **Body**: FormData with audio file
- **Returns**: `{ text: string }`

---

### Admin

#### `POST /api/admin/promote`
- **File**: `src/app/api/admin/promote/route.ts`
- **Description**: Promote user to admin role
- **Auth**: Required + Admin role
- **Body**: `{ userId?: string, email?: string }`
- **Returns**: Updated user object

---

### Payments & Subscriptions

#### `POST /api/stripe/create-session`
- **File**: `src/app/api/stripe/create-session/route.ts`
- **Description**: Create Stripe checkout session
- **Auth**: Required
- **Returns**: Checkout session URL

#### `POST /api/webhooks/stripe`
- **File**: `src/app/api/webhooks/stripe/route.ts`
- **Description**: Stripe webhook handler for subscription events
- **Auth**: Public (verified by Stripe signature)
- **Events**: 
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

---

### Monitoring & Metrics

#### `GET /api/metrics`
- **File**: `src/app/api/metrics/route.ts`
- **Description**: Prometheus metrics endpoint
- **Auth**: Public (should be protected in production)
- **Returns**: Prometheus-formatted metrics
- **Metrics**:
  - HTTP request duration
  - HTTP request totals
  - Active users
  - PDF uploads
  - AI operations
  - Token usage
  - AI costs

---

### Proxy

#### `GET /api/proxy`
- **File**: `src/app/api/proxy/route.ts`
- **Description**: Proxy endpoint (if needed for CORS)
- **Auth**: Varies

---

## 🔄 tRPC Endpoints

All tRPC endpoints are available at `/api/trpc/[procedure]` and can be called via:
- HTTP GET/POST
- tRPC client (recommended)

### Public Procedures

#### `authCallback`
- **Type**: Query
- **Description**: Handle authentication callback and create/update user
- **Auth**: Public (handled internally)

---

### Private Procedures (Require Authentication)

#### `getFiles`
- **Type**: Query
- **Description**: Get all files for current user
- **Returns**: Array of file objects

#### `getFile`
- **Type**: Query
- **Input**: `{ fileId: string }`
- **Description**: Get specific file details
- **Returns**: File object with metadata

#### `getFileMessages`
- **Type**: Query (Infinite)
- **Input**: `{ fileId: string, cursor?: string, limit?: number }`
- **Description**: Get messages for a file (infinite scroll)
- **Returns**: `{ items: Message[], nextCursor?: string }`

#### `getFileUploadStatus`
- **Type**: Query
- **Input**: `{ fileId: string }`
- **Description**: Get upload/processing status
- **Returns**: `UploadStatus` enum

#### `deleteFile`
- **Type**: Mutation
- **Input**: `{ id: string }`
- **Description**: Delete a file
- **Returns**: `{ success: boolean }`

#### `generateDocumentSummary`
- **Type**: Mutation
- **Input**: `{ fileId: string }`
- **Description**: Generate or retrieve document summary
- **Returns**: `{ summary: string }`

#### `getCurrentUsage`
- **Type**: Query
- **Description**: Get current month usage statistics for user
- **Returns**: Usage stats object

#### `createStripeSession`
- **Type**: Mutation
- **Description**: Create Stripe checkout session for subscription
- **Returns**: `{ url: string }` - Checkout session URL
- **Features**:
  - Creates subscription checkout session
  - Redirects to Stripe payment page

---

### Admin Procedures (Require Admin Role)

#### `adminGetUsers`
- **Type**: Query
- **Input**: `{ page?: number, limit?: number, search?: string, role?: 'USER' | 'ADMIN', accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'BANNED' }`
- **Description**: Get paginated list of users with filters
- **Returns**: `{ users: User[], total: number, totalPages: number }`

#### `adminGetUserStats`
- **Type**: Query
- **Input**: `{ userId: string }`
- **Description**: Get statistics for a specific user
- **Returns**: User stats (files, messages, tokens, cost)

#### `adminUpdateUserRole`
- **Type**: Mutation
- **Input**: `{ userId: string, role: 'USER' | 'ADMIN' }`
- **Description**: Update user's role
- **Returns**: Updated user object

#### `adminUpdateUserStatus`
- **Type**: Mutation
- **Input**: `{ userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' }`
- **Description**: Update user's account status
- **Returns**: Updated user object

#### `adminUpdateUserSubscription`
- **Type**: Mutation
- **Input**: `{ userId: string, planName: 'Free' | 'Pro' }`
- **Description**: Update user's subscription tier
- **Returns**: `{ success: boolean }`

#### `adminGetUsageStats`
- **Type**: Query
- **Input**: `{ startDate?: Date, endDate?: Date }`
- **Description**: Get platform-wide usage statistics
- **Returns**: Aggregated usage stats

#### `adminGetActiveUsers`
- **Type**: Query
- **Input**: `{ days?: number }` (default: 30)
- **Description**: Get count of active users in last N days
- **Returns**: `number`

#### `adminGetUploadTrends`
- **Type**: Query
- **Input**: `{ days?: number }` (default: 30)
- **Description**: Get PDF upload trends over time
- **Returns**: `Array<{ date: string, count: number }>`

#### `adminGetTokenUsageByPlan`
- **Type**: Query
- **Description**: Get token usage breakdown by subscription plan
- **Returns**: `Array<{ plan: string, tokens: number, users: number }>`

#### `adminGetRevenueMetrics`
- **Type**: Query
- **Description**: Get revenue metrics (MRR, ARR, active subscriptions)
- **Returns**: `{ mrr: number, arr: number, totalRevenue: number, activeSubscriptions: number }`

---

## 📝 Notes

- All protected routes redirect to `/auth-callback?origin=[route]` if user is not authenticated
- Admin routes require both authentication and `ADMIN` role
- tRPC endpoints provide type-safe API access
- API routes use REST conventions
- File uploads are handled by UploadThing service
- Metrics endpoint should be protected in production

---

## 🔗 Quick Reference

**Public Routes:**
- `/` - Home
- `/pricing` - Pricing
- `/offline` - Offline page
- `/auth-callback` - Auth callback

**Protected Routes:**
- `/dashboard` - User dashboard
- `/dashboard/[fileid]` - File view & chat
- `/dashboard/billing` - Billing
- `/admin` - Admin panel (Admin only)

**Key API Endpoints:**
- `/api/message` - Chat with AI
- `/api/uploadthing` - File upload
- `/api/trpc/*` - tRPC endpoints
- `/api/metrics` - Prometheus metrics


'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Dynamically import AdminDashboard with SSR disabled to avoid tRPC context issues
const AdminDashboard = dynamic(
  () => import('./AdminDashboard'),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    ),
  }
)

export default function AdminDashboardWrapper() {
  return <AdminDashboard />
}


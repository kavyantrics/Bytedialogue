'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import type { getUserSubscriptionPlan } from '@/lib/stripe'

interface BillingFormWrapperProps {
  subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>
}

export default function BillingFormWrapper({ subscriptionPlan }: BillingFormWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Ensure component is mounted on client before rendering
    setMounted(true)
  }, [])

  // Dynamically import BillingForm with SSR disabled to avoid tRPC context issues
  // Import inside component to ensure React is fully initialized
  const BillingForm = dynamic(
    () => import('./BillingForm'),
    {
      ssr: false,
      loading: () => (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ),
    }
  )

  if (!mounted) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return <BillingForm subscriptionPlan={subscriptionPlan} />
}


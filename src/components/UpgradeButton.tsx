"use client"

import { ArrowRight } from 'lucide-react'
import { Button } from './ui/button'
import { useMutation } from '@tanstack/react-query'

interface StripeSession {
  url: string
}

const UpgradeButton = () => {
  const { mutate: createStripeSession, isPending } = useMutation<StripeSession, Error>({
    mutationFn: async () => {
      const response = await fetch('/api/stripe/create-session', {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to create Stripe session')
      }
      return response.json()
    },
    onSuccess: ({ url }) => {
      window.location.href = url ?? "/dashboard/billing"
    }
  })

  return (
    <Button 
      onClick={() => createStripeSession()} 
      className='w-full'
      disabled={isPending}
    >
      {isPending ? 'Loading...' : 'Upgrade now'} 
      <ArrowRight className='h-5 w-5 ml-1.5' />
    </Button>
  )
}

export default UpgradeButton

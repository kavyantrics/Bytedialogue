import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
      <WifiOff className="h-16 w-16 text-zinc-400 mb-4" />
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">You&apos;re Offline</h1>
      <p className="text-zinc-600 text-center max-w-md mb-6">
        It looks like you&apos;re not connected to the internet. Please check your connection and try again.
      </p>
      <Button asChild>
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  )
}


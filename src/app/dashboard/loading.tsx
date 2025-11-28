import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  )
}


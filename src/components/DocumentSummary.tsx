'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2, Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface DocumentSummaryProps {
  fileId: string
  summary?: string | null
}

export default function DocumentSummary({ fileId, summary: initialSummary }: DocumentSummaryProps) {
  const [summary, setSummary] = useState<string | null>(initialSummary || null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const generateSummary = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (error) {
      console.error('Error generating summary:', error)
      toast({
        title: 'Failed to generate summary',
        description: 'Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (summary) {
    return (
      <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <h3 className="font-semibold text-sm text-zinc-900">Document Summary</h3>
        </div>
        <p className="text-sm text-zinc-700 leading-relaxed">{summary}</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-zinc-500" />
          <span className="text-sm text-zinc-600">No summary available</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={generateSummary}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Summary'
          )}
        </Button>
      </div>
    </div>
  )
}


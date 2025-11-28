'use client'

import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'

interface FollowUpSuggestionsProps {
  suggestions: string[]
  onSuggestionClick: (suggestion: string) => void
}

export default function FollowUpSuggestions({
  suggestions,
  onSuggestionClick,
}: FollowUpSuggestionsProps) {
  const [clickedIndex, setClickedIndex] = useState<number | null>(null)

  if (!suggestions || suggestions.length === 0) {
    return null
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Sparkles className="h-3 w-3" />
        <span>Suggested questions:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="text-xs h-auto py-1.5 px-3 whitespace-normal text-left"
            onClick={() => {
              setClickedIndex(index)
              onSuggestionClick(suggestion)
            }}
            disabled={clickedIndex === index}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  )
}


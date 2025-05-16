'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import type { TextareaAutosizeProps } from 'react-textarea-autosize'
import { cn } from '@/lib/utils'

const TextareaAutosize = dynamic(
  () => import('react-textarea-autosize').then((mod) => mod.default),
  { ssr: false }
)

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaAutosizeProps
>(({ className, maxRows, minRows, ...props }, ref) => {
  return (
    <TextareaAutosize
      className={cn(
        'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      maxRows={maxRows}
      minRows={minRows}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }

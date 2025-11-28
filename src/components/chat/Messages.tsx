import { useRef, useEffect } from 'react'
import { trpc } from '@/app/_trpc/client'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query'
import { Loader2 } from 'lucide-react'
import MessageComponent from './Message'

interface MessagesProps {
  fileId: string
}

interface Message {
  id: string
  text: string
  isUserMessage: boolean
  createdAt: string
  updatedAt: string
  userId: string
  fileId: string
}

const Messages = ({ fileId }: MessagesProps) => {
  const { data, isLoading, fetchNextPage } = trpc.getFileMessages.useInfiniteQuery(
    {
      fileId,
      limit: INFINITE_QUERY_LIMIT,
    },
    {
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
    }
  )

  // Get messages from all pages
  // Pages are ordered newest first, but items within each page are reversed (oldest to newest)
  // We need to combine them properly: older pages first, then newer pages
  const messages = data?.pages.flatMap((page) => page?.items ?? []) ?? []
  
  // Sort messages by creation time (oldest first) to ensure proper chronological order
  const sortedMessages = [...messages].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const loadingMessage = {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    id: 'loading-message',
    text: 'Thinking...',
    isUserMessage: false,
    userId: '',
    fileId,
  }

  // Add loading message at the end (newest)
  const combinedMessages = [
    ...sortedMessages,
    ...(isLoading ? [loadingMessage] : []),
  ]

  const lastMessageRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const isUserScrollingRef = useRef(false)
  const shouldAutoScrollRef = useRef(true)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Use intersection observer to detect when user scrolls to top (to load older messages)
  const topMessageRef = useRef<HTMLDivElement>(null)

  // Set up intersection observer manually for top message
  useEffect(() => {
    const topElement = topMessageRef.current
    const container = messagesContainerRef.current
    if (!topElement || !container) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        // Check if we have more messages to load
        const lastPage = data?.pages?.[data.pages.length - 1]
        const hasMoreMessages = lastPage?.nextCursor

        if (entry.isIntersecting && hasMoreMessages) {
          // Save current scroll position before loading
          const previousScrollHeight = container.scrollHeight
          const previousScrollTop = container.scrollTop

          fetchNextPage().then(() => {
            // After loading older messages, maintain scroll position
            // This prevents jumping when older messages are loaded above
            requestAnimationFrame(() => {
              if (container) {
                const newScrollHeight = container.scrollHeight
                const scrollDifference = newScrollHeight - previousScrollHeight
                container.scrollTop = previousScrollTop + scrollDifference
              }
            })
          })
        }
      },
      {
        root: container,
        threshold: 0.1,
      }
    )

    observer.observe(topElement)
    return () => observer.disconnect()
  }, [fetchNextPage, data?.pages])

  // Only auto-scroll if user hasn't manually scrolled up
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      // Check if user is near the bottom (within 100px)
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      shouldAutoScrollRef.current = isNearBottom
      isUserScrollingRef.current = true
      
      // Reset flag after scroll ends
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false
      }, 150)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive and user is at bottom
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    if (shouldAutoScrollRef.current && !isUserScrollingRef.current) {
      // Scroll to bottom to show newest messages
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    }
  }, [combinedMessages.length]) // Only trigger on message count change

  // Initial scroll to bottom on mount and when messages first load
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      // Always scroll to bottom when component mounts or messages first load
      // This ensures chat starts at the bottom showing latest messages
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    }
  }, [data?.pages.length]) // When pages are first loaded

  // Also scroll to bottom when messages are first rendered
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container && combinedMessages.length > 0 && data?.pages.length === 1) {
      // On first load, scroll to bottom
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    }
  }, [combinedMessages.length, data?.pages.length])

  return (
    <div 
      ref={messagesContainerRef}
      className="flex h-full border-zinc-200 flex-1 flex-col gap-4 p-3 overflow-y-auto overflow-x-hidden scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch"
      style={{ scrollBehavior: 'smooth' }}
    >
      {combinedMessages && combinedMessages.length > 0 ? (
        combinedMessages.map((message, i) => {
          const isNextMessageSamePerson =
            combinedMessages[i - 1]?.isUserMessage ===
            combinedMessages[i]?.isUserMessage

          // Use stable key based on message ID
          const messageKey = message?.id || `message-${i}`

          // First message (oldest) - attach intersection observer for infinite scroll
          if (i === 0) {
            return (
              <MessageComponent
                ref={topMessageRef}
                message={message}
                isNextMessageSamePerson={isNextMessageSamePerson}
                key={messageKey}
              />
            )
          }
          // Last message (newest) - attach ref for auto-scroll
          else if (i === combinedMessages.length - 1) {
            return (
              <MessageComponent
                ref={lastMessageRef}
                message={message}
                isNextMessageSamePerson={isNextMessageSamePerson}
                key={messageKey}
              />
            )
          } else {
            return (
              <MessageComponent
                message={message}
                isNextMessageSamePerson={isNextMessageSamePerson}
                key={messageKey}
              />
            )
          }
        })
      ) : isLoading ? (
        <div className="w-full flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <p className="text-zinc-500 text-sm">No messages yet.</p>
        </div>
      )}
    </div>
  )
}

export default Messages

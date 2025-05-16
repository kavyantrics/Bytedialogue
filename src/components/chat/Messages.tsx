import { useRef, useEffect } from 'react'
import { trpc } from '@/app/_trpc/client'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query'
import { Loader2 } from 'lucide-react'
import MessageComponent from './Message'
import { useIntersection } from '@mantine/hooks'

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

  const messages = data?.pages.flatMap((page) => page?.items ?? []) ?? []

  const loadingMessage = {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    id: 'loading-message',
    text: 'Thinking...',
    isUserMessage: false,
    userId: '',
    fileId,
  }

  const combinedMessages = [
    ...messages,
    ...(isLoading ? [loadingMessage] : []),
  ]

  const lastMessageRef = useRef<HTMLDivElement>(null)
  const { entry } = useIntersection({
    root: null,
    threshold: 1,
  })

  useEffect(() => {
    if (entry?.isIntersecting) {
      fetchNextPage()
    }
  }, [entry, fetchNextPage])

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  return (
    <div className="flex max-h-[calc(100vh-3.5rem-7rem)] border-zinc-200 flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch">
      {combinedMessages && combinedMessages.length > 0 ? (
        combinedMessages.map((message, i) => {
          const isNextMessageSamePerson =
            combinedMessages[i - 1]?.isUserMessage ===
            combinedMessages[i]?.isUserMessage

          if (i === combinedMessages.length - 1) {
            return (
              <MessageComponent
                ref={lastMessageRef}
                message={message}
                isNextMessageSamePerson={isNextMessageSamePerson}
                key={message?.id || `message-${i}`}
              />
            )
          } else {
            return (
              <MessageComponent
                message={message}
                isNextMessageSamePerson={isNextMessageSamePerson}
                key={message?.id || `message-${i}`}
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

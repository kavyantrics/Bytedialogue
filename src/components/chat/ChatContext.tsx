import {
  ReactNode,
  createContext,
  useRef,
  useState,
} from 'react'
import { useToast } from '../ui/use-toast'
import { useMutation } from '@tanstack/react-query'
import { trpc } from '@/app/_trpc/client'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query'

type StreamResponse = {
  addMessage: () => void
  sendMessage: (message: string) => void // Add method to send message directly
  message: string
  handleInputChange: (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => void
  isLoading: boolean
}

export const ChatContext = createContext<StreamResponse>({
  addMessage: () => {},
  sendMessage: () => {},
  message: '',
  handleInputChange: () => {},
  isLoading: false,
})

interface Props {
  fileId: string
  children: ReactNode
}

export const ChatContextProvider = ({
  fileId,
  children,
}: Props) => {
  const [message, setMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const utils = trpc.useContext()

  const { toast } = useToast()

  const backupMessage = useRef('')

  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({
      message,
    }: {
      message: string
    }) => {
      const response = await fetch('/api/message', {
        method: 'POST',
        body: JSON.stringify({
          fileId,
          message,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      return response.body
    },
    onMutate: async ({ message }) => {
      backupMessage.current = message
      setMessage('')

      // Cancel any outgoing refetches
      await utils.getFileMessages.cancel()

      // Get the current messages
      const previousMessages = utils.getFileMessages.getInfiniteData()

      // Optimistically update the messages
      utils.getFileMessages.setInfiniteData(
        { fileId, limit: INFINITE_QUERY_LIMIT },
        (old) => {
          if (!old || !old.pages || old.pages.length === 0) {
            // If no pages exist, create a new page with the message
            return {
              pages: [
                {
                  items: [
                    {
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      id: crypto.randomUUID(),
                      text: message,
                      isUserMessage: true,
                      userId: '', // This will be set by the server
                      fileId,
                    },
                  ],
                  nextCursor: undefined,
                },
              ],
              pageParams: [undefined],
            }
          }

          const newPages = old.pages.map((page, index) => {
            // Add message to the last page (newest messages)
            if (index === old.pages.length - 1) {
              return {
                ...page,
                items: [
                  ...page.items,
                  {
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    id: crypto.randomUUID(),
                    text: message,
                    isUserMessage: true,
                    userId: '', // This will be set by the server
                    fileId,
                  },
                ],
              }
            }
            return page
          })

          return {
            ...old,
            pages: newPages,
          }
        }
      )

      setIsLoading(true)

      return { previousMessages }
    },
    onSuccess: async (stream) => {
      setIsLoading(false)

      if (!stream) {
        return toast({
          title: 'There was a problem sending this message',
          description: 'Please refresh this page and try again',
          variant: 'destructive',
        })
      }

      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let done = false
      let accResponse = ''

      // Throttle updates to reduce re-renders
      let lastUpdateTime = 0
      const UPDATE_THROTTLE = 50 // Update every 50ms instead of on every chunk

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunkValue = decoder.decode(value)
        accResponse += chunkValue

        // Throttle updates to prevent excessive re-renders
        const now = Date.now()
        if (now - lastUpdateTime < UPDATE_THROTTLE && !doneReading) {
          continue
        }
        lastUpdateTime = now

        // Update the messages with the streaming response
        utils.getFileMessages.setInfiniteData(
          { fileId, limit: INFINITE_QUERY_LIMIT },
          (old) => {
            if (!old) return { pages: [], pageParams: [] }

            const isAiResponseCreated = old.pages.some(
              (page) =>
                page.items.some(
                  (item) => item.id === 'ai-response'
                )
            )

            const updatedPages = old.pages.map((page) => {
              // Update the last page (where newest messages are)
              if (page === old.pages[old.pages.length - 1]) {
                let updatedItems

                if (!isAiResponseCreated) {
                  // Add AI response at the end
                  updatedItems = [
                    ...page.items,
                    {
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      id: 'ai-response',
                      text: accResponse,
                      isUserMessage: false,
                      userId: '', // This will be set by the server
                      fileId,
                    },
                  ]
                } else {
                  // Update existing AI response
                  updatedItems = page.items.map(
                    (item) => {
                      if (item.id === 'ai-response') {
                        return {
                          ...item,
                          text: accResponse,
                        }
                      }
                      return item
                    }
                  )
                }

                return {
                  ...page,
                  items: updatedItems,
                }
              }

              return page
            })

            return { ...old, pages: updatedPages }
          }
        )
      }
    },
    onError: (_, __, context) => {
      setMessage(backupMessage.current)
      utils.getFileMessages.setData(
        { fileId },
        { items: context?.previousMessages?.pages.flatMap((page) => page.items) ?? [] }
      )
    },
    onSettled: async () => {
      setIsLoading(false)
      await utils.getFileMessages.invalidate({ fileId })
    },
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setMessage(e.target.value)
  }

  const addMessage = () => {
    if (!message.trim()) {
      return
    }
    sendMessage({ message: message.trim() })
  }

  const sendMessageDirectly = (msg: string) => {
    if (!msg.trim()) {
      return
    }
    sendMessage({ message: msg.trim() })
  }

  return (
    <ChatContext.Provider
      value={{
        addMessage,
        sendMessage: sendMessageDirectly,
        message,
        handleInputChange,
        isLoading,
      }}>
      {children}
    </ChatContext.Provider>
  )
}

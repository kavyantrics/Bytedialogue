import { cn } from '@/lib/utils'
import { ExtendedMessage } from '@/types/message'
import { Icons } from '../Icons'
import ReactMarkdown from 'react-markdown'
import { format } from 'date-fns'
import { forwardRef, memo } from 'react'
import FollowUpSuggestions from './FollowUpSuggestions'

interface MessageProps {
  message: ExtendedMessage & { followUpSuggestions?: string | null }
  isNextMessageSamePerson: boolean
  onSuggestionClick?: (suggestion: string) => void
}

const Message = memo(forwardRef<HTMLDivElement, MessageProps>(
  ({ message, isNextMessageSamePerson, onSuggestionClick }, ref) => {
    // Parse follow-up suggestions if they exist
    let followUpSuggestions: string[] = []
    if (message.followUpSuggestions) {
      try {
        followUpSuggestions = JSON.parse(message.followUpSuggestions) as string[]
      } catch (error) {
        console.error('Error parsing follow-up suggestions:', error)
      }
    }
    return (
      <div
        ref={ref}
        className={cn('flex items-end gap-2 px-2 py-1', {
          'justify-end': message.isUserMessage,
          'justify-start': !message.isUserMessage,
        })}>
        {/* Avatar - only show for AI messages, and only if next message is from different person */}
        {!message.isUserMessage && (
          <div
            className={cn(
              'relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full overflow-hidden',
              {
                'invisible': isNextMessageSamePerson,
              }
            )}>
            <div className="h-full w-full bg-zinc-200 flex items-center justify-center">
              <Icons.logo className='fill-zinc-600 h-5 w-5' />
            </div>
          </div>
        )}

        <div
          className={cn(
            'flex flex-col max-w-[70%]',
            {
              'items-end': message.isUserMessage,
              'items-start': !message.isUserMessage,
            }
          )}>
          <div
            className={cn(
              'px-3 py-2 rounded-lg inline-block shadow-sm',
              {
                'bg-blue-500 text-white rounded-tr-none':
                  message.isUserMessage,
                'bg-zinc-200 text-zinc-900 rounded-tl-none':
                  !message.isUserMessage,
              }
            )}>
            {typeof message.text === 'string' ? (
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className={cn('text-sm leading-relaxed break-words', {
                      'text-white': message.isUserMessage,
                      'text-zinc-900': !message.isUserMessage,
                    })}>
                      {children}
                    </p>
                  ),
                }}>
                {message.text}
              </ReactMarkdown>
            ) : (
              <p className={cn('text-sm leading-relaxed break-words', {
                'text-white': message.isUserMessage,
                'text-zinc-900': !message.isUserMessage,
              })}>
                {message.text}
              </p>
            )}
            {message.id !== 'loading-message' ? (
              <div
                className={cn(
                  'text-xs select-none mt-1 flex items-center gap-1',
                  {
                    'text-blue-100 justify-end': message.isUserMessage,
                    'text-zinc-500 justify-start': !message.isUserMessage,
                  }
                )}>
                <span>
                  {format(
                    new Date(message.createdAt),
                    'HH:mm'
                  )}
                </span>
              </div>
            ) : null}
          </div>
          
          {/* Show follow-up suggestions for AI messages */}
          {!message.isUserMessage && followUpSuggestions.length > 0 && onSuggestionClick && (
            <div className="mt-2">
              <FollowUpSuggestions
                suggestions={followUpSuggestions}
                onSuggestionClick={onSuggestionClick}
              />
            </div>
          )}
        </div>

        {/* Spacer for user messages to align properly */}
        {message.isUserMessage && (
          <div className="w-8 flex-shrink-0" />
        )}
      </div>
    )
  }
))

Message.displayName = 'Message'

export default Message

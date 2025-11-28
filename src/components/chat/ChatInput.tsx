import { Send } from 'lucide-react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { useContext, useRef } from 'react'
import { ChatContext } from './ChatContext'
import VoiceInput from './VoiceInput'

interface ChatInputProps {
  isDisabled?: boolean
}

const ChatInput = ({ isDisabled }: ChatInputProps) => {
  const {
    addMessage,
    handleInputChange,
    isLoading,
    message,
    sendMessage,
  } = useContext(ChatContext)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    if (!message.trim() || isLoading || isDisabled) {
      return
    }
    addMessage()
    textareaRef.current?.focus()
  }

  return (
    <div className='absolute bottom-0 left-0 w-full'>
      <div className='mx-2 flex flex-row gap-3 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl'>
        <div className='relative flex h-full flex-1 items-stretch md:flex-col'>
          <div className='relative flex flex-col w-full flex-grow p-4'>
            <div className='relative'>
              <Textarea
                rows={1}
                ref={textareaRef}
                maxRows={4}
                autoFocus
                onChange={handleInputChange}
                value={message}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder='Enter your question...'
                className='resize-none pr-20 text-base py-3 scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch'
              />

              <div className='absolute bottom-1.5 right-[8px] flex items-center gap-1'>
                <VoiceInput
                  onTranscript={(text) => {
                    // Set the transcribed text in the textarea
                    if (textareaRef.current) {
                      textareaRef.current.value = text
                      handleInputChange({ target: textareaRef.current } as React.ChangeEvent<HTMLTextAreaElement>)
                    }
                  }}
                  disabled={isLoading || isDisabled}
                />
                <Button
                  disabled={isLoading || isDisabled || !message.trim()}
                  aria-label='send message'
                  onClick={handleSubmit}>
                  <Send className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInput

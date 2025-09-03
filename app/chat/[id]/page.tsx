'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Title,
  TextArea,
  Button,
  Card,
  CardBody,
  Spinner,
  Alert,
  AlertActionCloseButton,
  EmptyState,
  EmptyStateBody,
} from '@patternfly/react-core'
import { ChatLayout } from '../../components/ChatLayout'
import { useAuth } from '../../contexts/AuthContext'
import type { ChatMessage, ChatThread } from '../../lib/supabase'

export default function ChatThreadPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [thread, setThread] = useState<ChatThread | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingThread, setIsLoadingThread] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // =============================================================================
  // Data Fetching
  // Fetches thread details and messages
  // =============================================================================
  useEffect(() => {
    if (id && user) {
      fetchThreadData()
    }
  }, [id, user])

  const fetchThreadData = async () => {
    try {
      setIsLoadingThread(true)

      // Fetch thread details
      const threadResponse = await fetch(`/api/chat/threads/${id}`)
      if (threadResponse.ok) {
        const threadData = await threadResponse.json()
        setThread(threadData.thread)
      }

      // Fetch messages
      const messagesResponse = await fetch(`/api/chat/messages?threadId=${id}`)
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json()
        setMessages(messagesData.messages || [])
      }
    } catch (error) {
      console.error('Error fetching thread data:', error)
      setError('Failed to load chat thread')
    } finally {
      setIsLoadingThread(false)
    }
  }

  // =============================================================================
  // Message Handling
  // Manages sending new messages and updating the conversation
  // =============================================================================
  const handleSendMessage = async () => {
    if (!message.trim() || !user || !id) return

    setIsLoading(true)
    setError(null)

    try {
      // Store user message
      const userMessageResponse = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: id,
          role: 'user',
          content: message,
        }),
      })

      if (!userMessageResponse.ok) {
        throw new Error('Failed to send message')
      }

      const userMessage = await userMessageResponse.json()
      setMessages(prev => [...prev, userMessage.message])

      // Get response from Ollama
      const ollamaResponse = await fetch('/api/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      })

      if (!ollamaResponse.ok) {
        throw new Error('Failed to get response from AI')
      }

      const ollamaData = await ollamaResponse.json()

      // Store AI response
      const aiMessageResponse = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: id,
          role: 'assistant',
          content: ollamaData.response,
        }),
      })

      if (aiMessageResponse.ok) {
        const aiMessage = await aiMessageResponse.json()
        setMessages(prev => [...prev, aiMessage.message])
      }

      setMessage('')

      // Refresh thread data to update message count
      fetchThreadData()
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const clearError = () => setError(null)

  if (isLoadingThread) {
    return (
      <ChatLayout>
        <div className="loading-spinner">
          <Spinner size="lg" />
          <span style={{ marginLeft: '1rem' }}>Loading chat thread...</span>
        </div>
      </ChatLayout>
    )
  }

  if (!thread) {
    return (
      <ChatLayout>
        <EmptyState>
          <EmptyStateBody>
            <h4>Chat thread not found</h4>
            <p>
              The chat thread you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have access to it.
            </p>
          </EmptyStateBody>
        </EmptyState>
      </ChatLayout>
    )
  }

  return (
    <ChatLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 0' }}>
        <Title headingLevel="h1" size="xl" style={{ marginBottom: '1rem' }}>
          {thread.title}
        </Title>

        {error && (
          <Alert
            variant="danger"
            title="Error"
            actionClose={<AlertActionCloseButton onClose={clearError} />}
            style={{ marginBottom: '1rem' }}
          >
            {error}
          </Alert>
        )}

        {/* Messages Display */}
        <div style={{ marginBottom: '2rem', minHeight: '400px' }}>
          {messages.length === 0 ? (
            <EmptyState>
              <EmptyStateBody>
                <h4>No messages yet</h4>
                <p>Start the conversation by sending a message below.</p>
              </EmptyStateBody>
            </EmptyState>
          ) : (
            <div>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.role}`}
                  style={{
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                    marginBottom: '1rem',
                  }}
                >
                  <Card>
                    <CardBody>
                      <div
                        style={{
                          backgroundColor:
                            msg.role === 'user'
                              ? 'var(--pf-v6-global--primary-color--100)'
                              : 'var(--pf-v6-global--BackgroundColor--200)',
                          color: msg.role === 'user' ? 'white' : 'inherit',
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          maxWidth: '80%',
                          marginLeft: msg.role === 'user' ? 'auto' : '0',
                        }}
                      >
                        {msg.content}
                      </div>
                    </CardBody>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="message-input-container">
          <Card>
            <CardBody>
              <div style={{ marginBottom: '1rem' }}>
                <TextArea
                  value={message}
                  onChange={(_, value) => setMessage(value)}
                  placeholder="Type your message here..."
                  rows={3}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  aria-label="Message input"
                />
              </div>

              <Button
                variant="primary"
                onClick={handleSendMessage}
                isLoading={isLoading}
                isDisabled={!message.trim()}
              >
                Send Message
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </ChatLayout>
  )
}

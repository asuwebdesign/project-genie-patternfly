'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Title,
  Card,
  CardBody,
  Spinner,
  Alert,
  AlertActionCloseButton,
} from '@patternfly/react-core'
import { ChatLayout } from '../components/ChatLayout'
import { MessageInput } from '../components/MessageInput'
import { useAuth } from '../contexts/AuthContext'

export default function ChatPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)

  // =============================================================================
  // Message Handling
  // Manages sending messages to Ollama and storing in database
  // =============================================================================
  const handleSendMessage = async () => {
    if (!message.trim() || !user) return

    setIsLoading(true)
    setError(null)

    try {
      // Create new thread if none exists
      let threadId = currentThreadId
      if (!threadId) {
        const threadResponse = await fetch('/api/chat/threads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: message.substring(0, 50) + '...' }),
        })

        if (!threadResponse.ok) {
          throw new Error('Failed to create chat thread')
        }

        const threadData = await threadResponse.json()
        threadId = threadData.thread.id
        setCurrentThreadId(threadId)
      }

      // Store user message
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          role: 'user',
          content: message,
        }),
      })

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
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          role: 'assistant',
          content: ollamaData.response,
        }),
      })

      // Navigate to the thread
      router.push(`/chat/${threadId}`)
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsLoading(false)
      setMessage('')
    }
  }



  const clearError = () => setError(null)

  return (
    <ChatLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 0' }}>
        <Title headingLevel="h1" size="2xl" style={{ marginBottom: '1rem' }}>
          Welcome to Project Genie
        </Title>

        <div style={{ marginBottom: '2rem' }}>
          <p>
            Start a conversation with our AI assistant. Ask questions, get help
            with coding, or explore any topic you&apos;re interested in.
          </p>
        </div>

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

        <Card>
          <CardBody>
            <MessageInput
              onSend={(content) => {
                setMessage(content)
                // Trigger the send after setting the message
                setTimeout(() => handleSendMessage(), 0)
              }}
              placeholder="Type your message here..."
              disabled={isLoading}
              isLoading={isLoading}
            />
          </CardBody>
        </Card>

        {isLoading && (
          <div className="loading-spinner">
            <Spinner size="lg" />
            <span style={{ marginLeft: '1rem' }}>
              Getting response from AI...
            </span>
          </div>
        )}
      </div>
    </ChatLayout>
  )
}

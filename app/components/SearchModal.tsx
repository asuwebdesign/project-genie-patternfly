'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  TextInput,
  Button,
  List,
  ListItem,
  Spinner,
  EmptyState,
  EmptyStateBody,
  ModalHeader,
  ModalBody,
} from '@patternfly/react-core'
import type { ChatThread } from '../lib/supabase'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<ChatThread[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [allThreads, setAllThreads] = useState<ChatThread[]>([])

  // =============================================================================
  // Data Fetching
  // Fetches all chat threads for search functionality
  // =============================================================================
  useEffect(() => {
    if (isOpen) {
      fetchThreads()
    }
  }, [isOpen])

  const fetchThreads = async () => {
    try {
      const response = await fetch('/api/chat/threads')
      if (response.ok) {
        const data = await response.json()
        setAllThreads(data.threads || [])
      }
    } catch (error) {
      console.error('Error fetching threads:', error)
    }
  }

  // =============================================================================
  // Search Logic
  // Filters threads based on search term
  // =============================================================================
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)

    // Simulate search delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300))

    const filtered = allThreads.filter(thread =>
      thread.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    setSearchResults(filtered)
    setIsSearching(false)
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  }

  const handleThreadClick = (threadId: string) => {
    window.location.href = `/chat/${threadId}`
    onClose()
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
      return `${Math.floor(diffDays / 365)} years ago`
    } catch {
      return 'Unknown date'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="search-modal"
      variant="medium"
    >
      <ModalHeader title="Search chats" labelId="search-chats" />
      <ModalBody>
      <div style={{ marginBottom: '1rem' }}>
        <TextInput
          type="text"
          value={searchTerm}
          onChange={(_, value) => setSearchTerm(value)}
          placeholder="Search by thread title..."
          onKeyPress={handleKeyPress}
          aria-label="Search chat threads by title"
        />
        <Button
          variant="primary"
          onClick={handleSearch}
          isLoading={isSearching}
          style={{ marginTop: '0.5rem' }}
        >
          Search
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="search-results">
          <List>
            {searchResults.map(thread => (
              <ListItem
                key={thread.id}
                onClick={() => handleThreadClick(thread.id)}
                className="chat-thread-item"
              >
                <div>
                  <strong>{thread.title}</strong>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--pf-v6-global--Color--200)',
                    }}
                  >
                    {formatDate(thread.updated_at)} • {thread.message_count}{' '}
                    messages
                  </div>
                </div>
              </ListItem>
            ))}
          </List>
        </div>
      )}

      {searchTerm && !isSearching && searchResults.length === 0 && (
        <EmptyState>
          <EmptyStateBody>
            <h4>No results found</h4>
            <p>
              No chat threads found matching &quot;{searchTerm}&quot;. Try a different
              search term.
            </p>
            <Button variant="primary" onClick={() => setSearchTerm('')}>
              Clear search
            </Button>
          </EmptyStateBody>
        </EmptyState>
      )}

      {!searchTerm && allThreads.length === 0 && (
        <EmptyState>
          <EmptyStateBody>
            <h4>No chat threads yet</h4>
            <p>Start a conversation to see your chat threads here.</p>
          </EmptyStateBody>
        </EmptyState>
      )}
      </ModalBody>
    </Modal>
  )
}

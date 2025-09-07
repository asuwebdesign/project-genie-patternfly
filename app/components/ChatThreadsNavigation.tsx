'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  NavList,
  NavItem,
  NavGroup,
} from '@patternfly/react-core'
import { ExtendedNavExpandable } from './ExtendedNavExpandable'
import { useThreads } from '../hooks/useThreads'
import type { ChatThread } from '../lib/supabase'
import { ClockRotateRight } from 'iconoir-react'

interface ChatThreadsNavigationProps {
  // No additional props needed - React Query handles all state management
}

// Separate component specifically for thread list to isolate re-renders
const ChatThreadItem = memo(({ thread }: { thread: ChatThread }) => {
  const router = useRouter()
  const pathname = usePathname()
  
  const handleClick = useCallback(() => {
    router.push(`/chat/${thread.id}`)
  }, [router, thread.id])
  
  const isActive = pathname === `/chat/${thread.id}`

  return (
    <NavItem
      itemId={thread.id}
      onClick={handleClick}
      isActive={isActive}
      className="chat-thread-item"
    >
      <div style={{ fontSize: '0.875rem' }}>{thread.title}</div>
    </NavItem>
  )
})

ChatThreadItem.displayName = 'ChatThreadItem'

// Main component that only re-renders when threads change
const ChatThreadsNavigationComponent = ({}: ChatThreadsNavigationProps) => {
  // Use React Query hook for threads - automatically handles caching, refetching, etc.
  const { threads, isLoading } = useThreads()
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true)

  console.log('🧵 ChatThreadsNavigation render - threads from cache:', threads.length)

  // Group threads by date - memoized to prevent recalculation
  const threadGroups = useMemo(() => {
    if (!threads || threads.length === 0) {
      return {
        today: [] as ChatThread[],
        yesterday: [] as ChatThread[],
        thisWeek: [] as ChatThread[],
        older: [] as ChatThread[],
      }
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const groups = {
      today: [] as ChatThread[],
      yesterday: [] as ChatThread[],
      thisWeek: [] as ChatThread[],
      older: [] as ChatThread[],
    }

    threads.forEach(thread => {
      const threadDate = new Date(thread.updated_at)
      if (threadDate >= today) {
        groups.today.push(thread)
      } else if (threadDate >= yesterday) {
        groups.yesterday.push(thread)
      } else if (threadDate >= lastWeek) {
        groups.thisWeek.push(thread)
      } else {
        groups.older.push(thread)
      }
    })

    return groups
  }, [threads])

  const handleExpandToggle = useCallback(() => {
    setIsHistoryExpanded(prev => !prev)
  }, [])

  return (
    <ExtendedNavExpandable
      title="History"
      ouiaId="history-nav-expandable"
      icon={<ClockRotateRight height={20} width={20} />}
      isExpanded={isHistoryExpanded}
      onExpand={handleExpandToggle}
    >
      {threadGroups.today.length > 0 && (
        <NavGroup title="Today">
          <NavList>
            {threadGroups.today.map(thread => (
              <ChatThreadItem key={thread.id} thread={thread} />
            ))}
          </NavList>
        </NavGroup>
      )}

      {threadGroups.yesterday.length > 0 && (
        <NavGroup title="Yesterday">
          <NavList>
            {threadGroups.yesterday.map(thread => (
              <ChatThreadItem key={thread.id} thread={thread} />
            ))}
          </NavList>
        </NavGroup>
      )}

      {threadGroups.thisWeek.length > 0 && (
        <NavGroup title="This Week">
          <NavList>
            {threadGroups.thisWeek.map(thread => (
              <ChatThreadItem key={thread.id} thread={thread} />
            ))}
          </NavList>
        </NavGroup>
      )}

      {threadGroups.older.length > 0 && (
        <NavGroup title="Older">
          <NavList>
            {threadGroups.older.map(thread => (
              <ChatThreadItem key={thread.id} thread={thread} />
            ))}
          </NavList>
        </NavGroup>
      )}

      {threads.length === 0 && !isLoading && (
        <NavItem itemId="no-threads" disabled>
          <div
            style={{
              fontSize: '0.875rem',
              color: 'var(--pf-v6-global--Color--200)',
            }}
          >
            No chat threads yet
          </div>
        </NavItem>
      )}
    </ExtendedNavExpandable>
  )
}

export const ChatThreadsNavigation = memo(ChatThreadsNavigationComponent)
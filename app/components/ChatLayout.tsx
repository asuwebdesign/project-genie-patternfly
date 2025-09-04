'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Page,
  PageSidebar,
  PageSidebarBody,
  PageSection,
  Nav,
  NavList,
  NavItem,
  NavGroup,
  NavExpandable,
  Button,
  Avatar,
  Dropdown,
  DropdownItem,
  Badge,
  PageToggleButton,
} from '@patternfly/react-core'
import { useAuth } from '../contexts/AuthContext'
import { SearchModal } from './SearchModal'
import type { ChatThread } from '../lib/supabase'

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16">
    <path d="m31.795 30.205-8.85-8.85A12.936 12.936 0 0 0 26 13c0-7.168-5.831-13-13-13S0 5.832 0 13s5.832 13 13 13c3.18 0 6.093-1.151 8.355-3.054l8.85 8.85a1.121 1.121 0 0 0 1.59 0c.44-.44.44-1.152 0-1.591ZM13 24C6.935 24 2 19.065 2 13S6.935 2 13 2s11 4.935 11 11-4.935 11-11 11Z"/>
  </svg>
)

interface ChatLayoutProps {
  children: React.ReactNode
}

export function ChatLayout({ children }: ChatLayoutProps) {
  const { user, profile, signOut, session } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true)

  console.log('Profile:', profile)

  // =============================================================================
  // Client-side hydration fix
  // Ensure client-side rendering matches server-side
  // =============================================================================
  useEffect(() => {
    setIsClient(true)
  }, [])

  // =============================================================================
  // Data Fetching
  // Fetches chat threads for navigation display
  // =============================================================================
  const fetchThreads = useCallback(async () => {
    try {
      console.log('Fetching threads...')
      setIsLoading(true)

      // Get the access token from the session
      const accessToken = session?.access_token
      if (!accessToken) {
        console.error('No access token available')
        return
      }

      const response = await fetch('/api/chat/threads', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
      console.log('Threads API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Threads data:', data)
        setThreads(data.threads || [])
      } else {
        const errorData = await response.json()
        console.error('Error response from threads API:', errorData)
      }
    } catch (error) {
      console.error('Error fetching threads:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (user && session) {
      console.log('User authenticated, fetching threads...', user.id)
      fetchThreads()
    } else {
      console.log('No user authenticated or no session')
      setIsLoading(false)
    }
  }, [user, session, fetchThreads])

  // =============================================================================
  // Navigation Handlers
  // Handles navigation between different sections
  // =============================================================================
  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const onSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const onDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  // Group threads by relative date - memoized and client-only to prevent hydration mismatch
  const threadGroups = useMemo(() => {
    // Return empty groups during SSR to prevent hydration mismatch
    if (!isClient) {
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
  }, [threads, isClient])

  console.log('Thread groups:', threadGroups)
  console.log('Total threads:', threads.length)

  // =============================================================================
  // Navigation Items
  // Defines the navigation structure with sticky header and footer
  // =============================================================================
  const Navigation = (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      {/* Brand Header - Sticky Top */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)',
          padding: '1rem',
          borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
        }}
      >
        <div
          style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: 'var(--pf-v6-global--Color--100)',
            marginBottom: '0.5rem',
          }}
        >
          Project Genie
        </div>
        {user && profile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
            }}
          >
            <Avatar
              src={
                profile?.avatar_url && profile.avatar_url.trim() !== ''
                  ? profile.avatar_url
                  : undefined
              }
              alt={profile?.name || user?.email || 'User'}
              size="sm"
            />
            <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>
              {profile?.name || user?.email || 'User'}
            </span>
          </div>
        )}
      </div>

      {/* Main Navigation - Scrollable Middle */}
      <div 
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem 0',
        }}
      >
        <Nav>
          <NavList>
            <NavItem itemId="search" onClick={() => setIsSearchModalOpen(true)} icon={<SearchIcon />}>
              Search
            </NavItem>

            <NavItem
              itemId="chat"
              onClick={() => handleNavigation('/chat')}
              isActive={pathname === '/chat'}
            >
              Chat
            </NavItem>

            <NavItem
              itemId="library"
              onClick={() => handleNavigation('/library')}
              isActive={pathname === '/library'}
            >
              Library
            </NavItem>

            <NavExpandable 
              title="History" 
              isExpanded={isHistoryExpanded}
              onExpand={() => setIsHistoryExpanded(!isHistoryExpanded)}
            >
              {threadGroups.today.length > 0 && (
                <NavGroup title={`Today (${threadGroups.today.length})`}>
                  {threadGroups.today.map(thread => (
                    <NavItem
                      key={thread.id}
                      itemId={thread.id}
                      onClick={() => handleNavigation(`/chat/${thread.id}`)}
                      isActive={pathname === `/chat/${thread.id}`}
                      className="chat-thread-item"
                    >
                      <div style={{ fontSize: '0.875rem' }}>
                        {thread.title}
                        <Badge isRead>{thread.message_count}</Badge>
                      </div>
                    </NavItem>
                  ))}
                </NavGroup>
              )}

              {threadGroups.yesterday.length > 0 && (
                <NavGroup title={`Yesterday (${threadGroups.yesterday.length})`}>
                  {threadGroups.yesterday.map(thread => (
                    <NavItem
                      key={thread.id}
                      itemId={thread.id}
                      onClick={() => handleNavigation(`/chat/${thread.id}`)}
                      isActive={pathname === `/chat/${thread.id}`}
                      className="chat-thread-item"
                    >
                      <div style={{ fontSize: '0.875rem' }}>
                        {thread.title}
                        <Badge isRead>{thread.message_count}</Badge>
                      </div>
                    </NavItem>
                  ))}
                </NavGroup>
              )}

              {threadGroups.thisWeek.length > 0 && (
                <NavGroup title={`This Week (${threadGroups.thisWeek.length})`}>
                  {threadGroups.thisWeek.map(thread => (
                    <NavItem
                      key={thread.id}
                      itemId={thread.id}
                      onClick={() => handleNavigation(`/chat/${thread.id}`)}
                      isActive={pathname === `/chat/${thread.id}`}
                      className="chat-thread-item"
                    >
                      <div style={{ fontSize: '0.875rem' }}>
                        {thread.title}
                        <Badge isRead>{thread.message_count}</Badge>
                      </div>
                    </NavItem>
                  ))}
                </NavGroup>
              )}

              {threadGroups.older.length > 0 && (
                <NavGroup title={`Older (${threadGroups.older.length})`}>
                  {threadGroups.older.map(thread => (
                    <NavItem
                      key={thread.id}
                      itemId={thread.id}
                      onClick={() => handleNavigation(`/chat/${thread.id}`)}
                      isActive={pathname === `/chat/${thread.id}`}
                      className="chat-thread-item"
                    >
                      <div style={{ fontSize: '0.875rem' }}>
                        {thread.title}
                        <Badge isRead>{thread.message_count}</Badge>
                      </div>
                    </NavItem>
                  ))}
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
            </NavExpandable>
          </NavList>
        </Nav>
      </div>

      {/* User Account Section - Sticky Bottom */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 1000,
          backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)',
          padding: '1rem',
          borderTop: '1px solid var(--pf-v6-global--BorderColor--100)',
        }}
      >
        <Dropdown
          onSelect={() => setIsDropdownOpen(false)}
          toggle={toggleRef => (
            <Button
              ref={toggleRef}
              variant="plain"
              onClick={onDropdownToggle}
              aria-label="User account menu"
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Avatar
                  src={
                    profile?.avatar_url && profile.avatar_url.trim() !== ''
                      ? profile.avatar_url
                      : 'https://cdn.dribbble.com/userupload/26673540/file/original-76d31f4cac3201997f896d6c7a5df5c9.png?resize=1504x1128&vertical=center'
                  }
                  alt={profile?.name || user?.email || 'User'}
                />
                <span>{profile?.name || user?.email || 'User'}</span>
              </div>
            </Button>
          )}
          isOpen={isDropdownOpen}
        >
          <DropdownItem key="profile">Profile</DropdownItem>
          <DropdownItem key="signout" onClick={handleSignOut}>
            Sign out
          </DropdownItem>
        </Dropdown>
        
        <PageToggleButton
          variant="plain"
          aria-label="Global navigation"
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={onSidebarToggle}
          id="vertical-nav-toggle"
          style={{ marginTop: '0.5rem' }}
        />
      </div>
    </div>
  )

  // const masthead = (
  //   <Masthead>
  //     <MastheadToggle></MastheadToggle>
  //   </Masthead>
  // )

  return (
    <>
      <Page
        // masthead={masthead}
        sidebar={
          <PageSidebar isSidebarOpen={isSidebarOpen} id="vertical-sidebar">
            <PageSidebarBody>{Navigation}</PageSidebarBody>
          </PageSidebar>
        }
      >
        <PageSection>{children}</PageSection>
      </Page>

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  )
}

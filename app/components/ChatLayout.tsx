'use client'

import { useState, useEffect } from 'react'
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
  Masthead,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  MastheadToggle,
  PageToggleButton,
} from '@patternfly/react-core'
import { useAuth } from '../contexts/AuthContext'
import { SearchModal } from './SearchModal'
import type { ChatThread } from '../lib/supabase'

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

  // =============================================================================
  // Data Fetching
  // Fetches chat threads for navigation display
  // =============================================================================
  useEffect(() => {
    if (user && session) {
      console.log('User authenticated, fetching threads...', user.id)
      fetchThreads()
    } else {
      console.log('No user authenticated or no session')
      setIsLoading(false)
    }
  }, [user, session])

  const fetchThreads = async () => {
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
  }

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

  // Group threads by relative date
  const groupThreadsByDate = () => {
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
  }

  const threadGroups = groupThreadsByDate()
  console.log('Thread groups:', threadGroups)
  console.log('Total threads:', threads.length)

  // =============================================================================
  // Navigation Items
  // Defines the navigation structure
  // =============================================================================
  const Navigation = (
    <Nav>
      <NavList>
        {/* Brand Header */}
        <div
          style={{
            padding: '1rem',
            borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
            marginBottom: '1rem',
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

        <NavItem itemId="search" onClick={() => setIsSearchModalOpen(true)}>
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

        <NavGroup title="History">
          {threadGroups.today.length > 0 && (
            <NavExpandable
              title={`Today (${threadGroups.today.length})`}
              isExpanded
            >
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
            </NavExpandable>
          )}

          {threadGroups.yesterday.length > 0 && (
            <NavExpandable
              title={`Yesterday (${threadGroups.yesterday.length})`}
              isExpanded
            >
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
            </NavExpandable>
          )}

          {threadGroups.thisWeek.length > 0 && (
            <NavExpandable
              title={`This Week (${threadGroups.thisWeek.length})`}
              isExpanded
            >
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
            </NavExpandable>
          )}

          {threadGroups.older.length > 0 && (
            <NavExpandable
              title={`Older (${threadGroups.older.length})`}
              isExpanded
            >
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
            </NavExpandable>
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
        </NavGroup>

        {/* User Account Section */}
        <div
          style={{
            marginTop: '2rem',
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
        </div>
        <PageToggleButton
          variant="plain"
          aria-label="Global navigation"
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={onSidebarToggle}
          id="vertical-nav-toggle"
        />
      </NavList>
    </Nav>
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

'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
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
  Button,
  Avatar,
  Dropdown,
  DropdownItem,
  Badge,
  PageToggleButton,
  Switch,
} from '@patternfly/react-core'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { SearchModal } from './SearchModal'
import { ExtendedNavExpandable } from './ExtendedNavExpandable'
import type { ChatThread } from '../lib/supabase'
import {
  ClockRotateRight,
  EditPencil,
  MediaImageList,
  Search,
} from 'iconoir-react'

interface ChatLayoutProps {
  children: React.ReactNode
}

const ChatLayoutComponent = ({ children }: ChatLayoutProps) => {
  const { user, profile, signOut, session } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true)

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
  const handleNavigation = useCallback(
    (path: string) => {
      router.push(path)
    },
    [router]
  )

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [signOut, router])

  const onSidebarToggle = useCallback(() => {
    setIsSidebarOpen(prev => !prev)
  }, [])

  const onDropdownToggle = useCallback(() => {
    setIsDropdownOpen(prev => !prev)
  }, [])

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

    // Only recalculate if threads actually changed
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
  }, [
    threads?.length,
    threads?.map(t => `${t.id}-${t.updated_at}`).join(','),
    isClient,
  ])

  // Memoize individual thread items to prevent re-renders
  const renderThreadItem = useCallback(
    (thread: ChatThread) => (
      <NavItem
        key={thread.id}
        itemId={thread.id}
        onClick={() => handleNavigation(`/chat/${thread.id}`)}
        isActive={pathname === `/chat/${thread.id}`}
        className="chat-thread-item"
      >
        <div style={{ fontSize: '0.875rem' }}>{thread.title}</div>
      </NavItem>
    ),
    [handleNavigation, pathname]
  )

  console.log('Thread groups:', threadGroups)
  console.log('Total threads:', threads.length)

  // =============================================================================
  // Navigation Items
  // Defines the navigation structure with sticky header and footer
  // =============================================================================
  const Navigation = useMemo(
    () => (
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
            scrollbarWidth: 'thin',
          }}
        >
          <Nav>
            <NavList>
              <NavItem
                itemId="search"
                onClick={() => setIsSearchModalOpen(true)}
                icon={<Search height={20} width={20} />}
              >
                Search
              </NavItem>

              <NavItem
                itemId="chat"
                onClick={() => handleNavigation('/chat')}
                icon={<EditPencil height={20} width={20} />}
                isActive={pathname === '/chat'}
              >
                Chat
              </NavItem>

              <NavItem
                itemId="library"
                onClick={() => handleNavigation('/library')}
                icon={<MediaImageList height={20} width={20} />}
                isActive={pathname === '/library'}
              >
                Library
              </NavItem>

              <ExtendedNavExpandable
                title="History"
                icon={<ClockRotateRight height={20} width={20} />}
                isExpanded={isHistoryExpanded}
                onExpand={() => setIsHistoryExpanded(!isHistoryExpanded)}
              >
                {threadGroups.today.length > 0 && (
                  <NavGroup title="Today">
                    {threadGroups.today.map(renderThreadItem)}
                  </NavGroup>
                )}

                {threadGroups.yesterday.length > 0 && (
                  <NavGroup title="Yesterday">
                    {threadGroups.yesterday.map(renderThreadItem)}
                  </NavGroup>
                )}

                {threadGroups.thisWeek.length > 0 && (
                  <NavGroup title="This Week">
                    {threadGroups.thisWeek.map(renderThreadItem)}
                  </NavGroup>
                )}

                {threadGroups.older.length > 0 && (
                  <NavGroup title="Older">
                    {threadGroups.older.map(renderThreadItem)}
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
            onSelect={(event, itemId) => {
              if (itemId === 'theme') {
                // Don't close dropdown for theme switch
                return
              }
              setIsDropdownOpen(false)
            }}
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
            <DropdownItem key="theme" onClick={toggleTheme}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  gap: '0.5rem',
                }}
              >
                <span>Dark theme</span>
                <Switch
                  id="theme-switch"
                  isChecked={theme === 'dark'}
                  onChange={toggleTheme}
                  aria-label="Toggle dark theme"
                  onClick={e => e.stopPropagation()}
                />
              </div>
            </DropdownItem>
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
    ),
    [
      user,
      profile,
      pathname,
      isHistoryExpanded,
      threadGroups,
      isLoading,
      isClient,
      handleNavigation,
      setIsHistoryExpanded,
      setIsSearchModalOpen,
      handleSignOut,
      onSidebarToggle,
      theme,
      toggleTheme,
      onDropdownToggle,
      renderThreadItem,
    ]
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
        onClose={useCallback(() => setIsSearchModalOpen(false), [])}
      />
    </>
  )
}

export const ChatLayout = memo(ChatLayoutComponent)

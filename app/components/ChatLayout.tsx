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
  Button,
  Avatar,
  Dropdown,
  DropdownItem,
  PageToggleButton,
  Switch,
  Divider,
} from '@patternfly/react-core'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useChat } from '../contexts/ChatContext'
import { SearchModal } from './SearchModal'
import { ChatThreadsNavigation } from './ChatThreadsNavigation'
import { EditPencil, MediaImageList, Search } from 'iconoir-react'

interface ChatLayoutProps {
  children: React.ReactNode
}

const ChatLayoutComponent = ({ children }: ChatLayoutProps) => {
  const { user, profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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
    console.log('Dropdown toggle clicked, current state:', isDropdownOpen)
    setIsDropdownOpen(prev => {
      console.log('Setting dropdown state to:', !prev)
      return !prev
    })
  }, [isDropdownOpen])

  // Debug dropdown state
  useEffect(() => {
    console.log('Dropdown state changed to:', isDropdownOpen)
  }, [isDropdownOpen])

  // =============================================================================
  // Memoized Navigation Components
  // Split navigation into smaller, focused components to prevent re-renders
  // =============================================================================

  // Memoized Brand Header - only re-renders when user/profile changes
  const BrandHeader = useMemo(
    () => (
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
    ),
    [user, profile]
  )

  // Memoized Main Navigation - only re-renders when pathname changes
  // Note: HistorySection is rendered separately to prevent unnecessary re-renders
  const MainNavigation = useMemo(
    () => (
      <>
        <NavList>
          <NavItem
            itemId="main-navigation-search"
            ouiaId="nav-item-search"
            onClick={() => setIsSearchModalOpen(true)}
            icon={<Search height={20} width={20} />}
          >
            Search
          </NavItem>

          <NavItem
            itemId="main-navigation-chat"
            ouiaId="nav-item-chat"
            onClick={() => handleNavigation('/chat')}
            icon={<EditPencil height={20} width={20} />}
            isActive={pathname === '/chat'}
          >
            Chat
          </NavItem>

          <NavItem
            itemId="main-navigation-library"
            ouiaId="nav-item-library"
            onClick={() => handleNavigation('/library')}
            icon={<MediaImageList height={20} width={20} />}
            isActive={pathname === '/library'}
          >
            Library
          </NavItem>
        </NavList>
        <Divider />
      </>
    ),
    [pathname, handleNavigation]
  )

  // Memoized User Account Section - only re-renders when user/profile/theme changes
  const UserAccountSection = useMemo(
    () => (
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
          ouiaId="user-account-dropdown"
          onSelect={(event, itemId) => {
            console.log('Dropdown onSelect called with itemId:', itemId)
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
              ouiaId="user-account-toggle"
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
          popperProps={{
            position: 'right',
            appendTo: () => document.body,
          }}
        >
          <DropdownItem key="profile" ouiaId="dropdown-item-profile">
            Profile
          </DropdownItem>
          <DropdownItem
            key="theme"
            onClick={toggleTheme}
            ouiaId="dropdown-item-theme"
          >
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
          <DropdownItem
            key="signout"
            onClick={handleSignOut}
            ouiaId="dropdown-item-signout"
          >
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
    ),
    [
      user,
      profile,
      theme,
      toggleTheme,
      isDropdownOpen,
      onDropdownToggle,
      handleSignOut,
      isSidebarOpen,
      onSidebarToggle,
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
            <PageSidebarBody>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100vh',
                }}
              >
                {/* Brand Header - Sticky Top */}
                {BrandHeader}

                {/* Main Navigation - Scrollable Middle */}
                <div
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '1rem 0',
                    scrollbarWidth: 'thin',
                  }}
                >
                  <Nav ouiaId="main-nav" variant="default">
                    {MainNavigation}
                    {/* Isolated thread navigation component with React Query caching */}
                    <ChatThreadsNavigation />
                  </Nav>
                </div>

                {/* User Account Section - Sticky Bottom */}
                {UserAccountSection}
              </div>
            </PageSidebarBody>
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

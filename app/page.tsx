'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LoginPage,
  LoginMainFooterLinksItem,
  Button,
  List,
  ListItem,
  LoginFooterItem,
} from '@patternfly/react-core'
import { ClientOnly } from './components/ClientOnly'
import { useAuth } from './contexts/AuthContext'

export default function HomePage() {
  const { user, signInWithGoogle, loading } = useAuth()
  const router = useRouter()

  // =============================================================================
  // Debug Authentication State
  // Log authentication state to help debug issues
  // =============================================================================
  useEffect(() => {
    console.log('HomePage: Authentication state changed:', {
      hasUser: !!user,
      loading,
      userId: user?.id,
    })
  }, [user, loading])

  // =============================================================================
  // Authentication Redirect
  // Redirects authenticated users to chat page
  // =============================================================================
  useEffect(() => {
    console.log('HomePage: Checking redirect conditions:', {
      hasUser: !!user,
      loading,
      shouldRedirect: user && !loading,
    })

    if (user && !loading) {
      console.log('HomePage: Redirecting to /chat')
      router.push('/chat')
    }
  }, [user, loading, router])

  const handleGoogleSignIn = async () => {
    try {
      console.log('HomePage: Google sign in button clicked')
      await signInWithGoogle()
    } catch (error) {
      console.error('Error signing in with Google:', error)
    }
  }

  const footerLinks = (
    <>
      <ListItem>
        <LoginFooterItem href="https://www.patternfly.org/">
          Terms of Use
        </LoginFooterItem>
      </ListItem>
      <ListItem>
        <LoginFooterItem href="https://www.patternfly.org/">
          Help
        </LoginFooterItem>
      </ListItem>
      <ListItem>
        <LoginFooterItem href="https://www.patternfly.org/">
          Privacy Policy
        </LoginFooterItem>
      </ListItem>
    </>
  )

  const socialMediaLoginContent = (
    <LoginMainFooterLinksItem>
      <Button
        variant="primary"
        onClick={handleGoogleSignIn}
        isDisabled={loading}
        style={{ width: '100%', marginTop: '1rem' }}
      >
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </Button>
    </LoginMainFooterLinksItem>
  )

  console.log('HomePage: Rendering with state:', {
    hasUser: !!user,
    loading,
    userId: user?.id,
  })

  if (loading) {
    console.log('HomePage: Showing loading state')
    return (
      <ClientOnly>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <div>Loading...</div>
        </div>
      </ClientOnly>
    )
  }

  if (user) {
    console.log('HomePage: User authenticated, showing null (will redirect)')
    return null // Will redirect via useEffect
  }

  console.log('HomePage: Showing login page')
  return (
    <ClientOnly>
      <LoginPage
        footerListItems={footerLinks}
        textContent="Welcome to Project Genie, your AI-powered chat assistant. Sign in with your Google account to get started."
        loginTitle="Welcome to Project Genie"
        loginSubtitle="Sign in to start chatting with AI"
        socialMediaLoginContent={socialMediaLoginContent}
        socialMediaLoginAriaLabel="Sign in with Google"
      />
    </ClientOnly>
  )
}

'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClientComponentClient } from '../lib/supabase'
import type { Profile } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshSession: () => Promise<{ user: User | null; session: Session | null } | void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // =============================================================================
  // Debug Environment Variables
  // Log environment variables to help debug issues
  // =============================================================================
  useEffect(() => {
    console.log('AuthContext: Environment check')
    console.log(
      'NEXT_PUBLIC_SUPABASE_URL:',
      process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'
    )
    console.log(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY:',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
    )
  }, [])

  const supabase = createClientComponentClient()

  // =============================================================================
  // Profile Management
  // Fetches and manages user profile data
  // =============================================================================
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      console.log('AuthContext: Fetching profile for user:', userId)
      
      // Add timeout for profile fetch
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .abortSignal(controller.signal)
        .single()

      clearTimeout(timeoutId)

      if (error) {
        // Handle specific error cases
        if (error.code === 'PGRST116') {
          console.log('AuthContext: Profile not found for user:', userId)
        } else {
          console.error('AuthContext: Error fetching profile:', error)
        }
        return null
      }

      console.log('AuthContext: Profile fetched successfully:', data)
      return data as Profile
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('AuthContext: Profile fetch timeout')
      } else {
        console.error('AuthContext: Error fetching profile:', error)
      }
      return null
    }
  }, [supabase])

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }

  const refreshSession = async () => {
    try {
      console.log('AuthContext: Refreshing session')
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('AuthContext: Error refreshing session:', error)
        throw error
      }

      console.log('AuthContext: Session refreshed successfully')
      return data
    } catch (error) {
      console.error('AuthContext: Failed to refresh session:', error)
      throw error
    }
  }

  // =============================================================================
  // Authentication Methods
  // Handles Google OAuth and sign out
  // =============================================================================
  const signInWithGoogle = async () => {
    try {
      console.log('AuthContext: Starting Google OAuth sign in')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/chat`,
        },
      })

      if (error) {
        console.error('Error signing in with Google:', error)
        throw error
      }

      console.log('AuthContext: Google OAuth initiated successfully')
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('AuthContext: Starting sign out')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
      console.log('AuthContext: Sign out successful')
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // =============================================================================
  // Session Management
  // Monitors authentication state changes with proper error handling
  // =============================================================================
  useEffect(() => {
    console.log('AuthContext: Setting up session management')
    
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null

    const initializeAuth = async () => {
      try {
        // Single timeout for the entire initialization process
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('AuthContext: Initialization timeout - setting loading to false')
            setLoading(false)
          }
        }, 10000) // 10 seconds - more reasonable timeout

        console.log('AuthContext: Getting initial session')
        
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!mounted) return // Component unmounted, don't update state

        if (error) {
          console.error('AuthContext: Error getting session:', error)
          setLoading(false)
          return
        }

        console.log('AuthContext: Initial session result:', {
          hasSession: !!session,
          userId: session?.user?.id,
        })

        // Update auth state
        setSession(session)
        setUser(session?.user ?? null)

        // Fetch profile if user exists
        if (session?.user) {
          console.log('AuthContext: User found in session, fetching profile')
          try {
            const profileData = await fetchProfile(session.user.id)
            if (mounted) {
              setProfile(profileData)
            }
          } catch (profileError) {
            console.error('AuthContext: Error fetching profile:', profileError)
            // Don't fail auth if profile fetch fails
            if (mounted) {
              setProfile(null)
            }
          }
        }

        if (mounted) {
          setLoading(false)
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
        }

        console.log('AuthContext: Initial session check complete')
      } catch (error) {
        console.error('AuthContext: Error during initialization:', error)
        if (mounted) {
          setLoading(false)
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
        }
      }
    }

    // Initialize auth state
    initializeAuth()

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('AuthContext: Auth state change event:', event, {
        hasSession: !!session,
        userId: session?.user?.id,
      })

      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
          console.log('AuthContext: User signed in')
          break
        case 'SIGNED_OUT':
          console.log('AuthContext: User signed out')
          break
        case 'TOKEN_REFRESHED':
          console.log('AuthContext: Token refreshed')
          break
        case 'USER_UPDATED':
          console.log('AuthContext: User updated')
          break
      }

      // Update auth state
      setSession(session)
      setUser(session?.user ?? null)

      // Handle profile management
      if (session?.user) {
        console.log('AuthContext: User found in auth state change, fetching profile')
        try {
          const profileData = await fetchProfile(session.user.id)
          if (mounted) {
            setProfile(profileData)
          }
        } catch (profileError) {
          console.error('AuthContext: Error fetching profile in auth change:', profileError)
          if (mounted) {
            setProfile(null)
          }
        }
      } else {
        console.log('AuthContext: No user in auth state change, clearing profile')
        setProfile(null)
      }

      // Set loading to false after handling auth change
      if (mounted) {
        setLoading(false)
      }

      console.log('AuthContext: Auth state change complete')
    })

    // Cleanup function
    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      subscription.unsubscribe()
    }
  }, [supabase.auth, fetchProfile]) // Include required dependencies

  const value = {
    user,
    profile,
    session,
    loading,
    signInWithGoogle,
    signOut,
    refreshProfile,
    refreshSession,
  }

  console.log('AuthContext: Rendering with state:', {
    hasUser: !!user,
    hasProfile: !!profile,
    hasSession: !!session,
    loading,
  })

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

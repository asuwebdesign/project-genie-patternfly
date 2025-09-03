'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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
  const fetchProfile = async (userId: string) => {
    try {
      console.log('AuthContext: Fetching profile for user:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      console.log('AuthContext: Profile fetched successfully:', data)
      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
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
  // Monitors authentication state changes
  // =============================================================================
  useEffect(() => {
    console.log('AuthContext: Setting up session management')

    // Fallback timeout to ensure loading is never stuck
    const fallbackTimeout = setTimeout(() => {
      console.warn('AuthContext: Fallback timeout - forcing loading to false')
      setLoading(false)
    }, 5000)

    const getSession = async () => {
      try {
        console.log('AuthContext: Getting initial session')

        // Add timeout to prevent hanging
        const timeoutId = setTimeout(() => {
          console.error(
            'AuthContext: Session timeout - forcing loading to false'
          )
          setLoading(false)
        }, 3000)

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        clearTimeout(timeoutId)

        if (error) {
          console.error('AuthContext: Error getting session:', error)
          setLoading(false)
          return
        }

        console.log('AuthContext: Initial session result:', {
          hasSession: !!session,
          userId: session?.user?.id,
        })

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          console.log('AuthContext: User found in session, fetching profile')
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        }

        setLoading(false)
        clearTimeout(fallbackTimeout)
        console.log(
          'AuthContext: Initial session check complete, loading set to false'
        )
      } catch (error) {
        console.error('AuthContext: Error getting initial session:', error)
        setLoading(false)
        clearTimeout(fallbackTimeout)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state change event:', event, {
        hasSession: !!session,
        userId: session?.user?.id,
      })

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        console.log(
          'AuthContext: User found in auth state change, fetching profile'
        )
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
      } else {
        console.log(
          'AuthContext: No user in auth state change, clearing profile'
        )
        setProfile(null)
      }

      setLoading(false)
      clearTimeout(fallbackTimeout)
      console.log(
        'AuthContext: Auth state change complete, loading set to false'
      )
    })

    return () => {
      clearTimeout(fallbackTimeout)
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const value = {
    user,
    profile,
    session,
    loading,
    signInWithGoogle,
    signOut,
    refreshProfile,
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

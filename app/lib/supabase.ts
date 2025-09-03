import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Debug environment variables
console.log('Supabase config:', {
  url: supabaseUrl ? 'Set' : 'Not set',
  key: supabaseAnonKey ? 'Set' : 'Not set',
  urlValue: supabaseUrl?.substring(0, 20) + '...',
  keyValue: supabaseAnonKey?.substring(0, 20) + '...',
})

// Singleton instance for client-side
let clientComponentClient: ReturnType<typeof createClient> | null = null

// Client-side Supabase client
export const createClientComponentClient = () => {
  if (clientComponentClient) {
    console.log('Reusing existing client component client')
    return clientComponentClient
  }

  console.log('Creating client component client...')
  try {
    // For client components, we need to use createClient with proper auth config
    clientComponentClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage:
          typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
    console.log('Client component client created successfully')
    return clientComponentClient
  } catch (error) {
    console.error('Error creating client component client:', error)
    throw error
  }
}

// Server-side Supabase client
export const createServerComponentClient = () => {
  console.log('Creating server component client...')
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
    console.log('Server component client created successfully')
    return client
  } catch (error) {
    console.error('Error creating server component client:', error)
    throw error
  }
}

// Types for our database schema
export interface Profile {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface ChatThread {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

export interface ChatMessage {
  id: string
  thread_id: string
  user_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export interface ChatThreadWithMessages extends ChatThread {
  messages: ChatMessage[]
}

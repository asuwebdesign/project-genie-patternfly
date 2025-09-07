'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import type { ChatThread } from '../lib/supabase'

// localStorage utilities for backup caching
const STORAGE_KEY = 'project-genie-threads'

const saveToLocalStorage = (userId: string, threads: ChatThread[]) => {
  try {
    const data = {
      userId,
      threads,
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save threads to localStorage:', error)
  }
}

const loadFromLocalStorage = (userId: string): ChatThread[] | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    const data = JSON.parse(stored)
    // Only return data if it's for the same user and not too old (1 hour)
    if (data.userId === userId && Date.now() - data.timestamp < 60 * 60 * 1000) {
      return data.threads
    }
    return null
  } catch (error) {
    console.warn('Failed to load threads from localStorage:', error)
    return null
  }
}

// Query key factory for threads
export const threadKeys = {
  all: ['threads'] as const,
  lists: () => [...threadKeys.all, 'list'] as const,
  list: (userId: string) => [...threadKeys.lists(), userId] as const,
  details: () => [...threadKeys.all, 'detail'] as const,
  detail: (id: string) => [...threadKeys.details(), id] as const,
}

// Fetch threads function with localStorage backup
async function fetchThreads(accessToken: string, userId: string): Promise<ChatThread[]> {
  try {
    const response = await fetch('/api/chat/threads', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch threads: ${response.status}`)
    }

    const data = await response.json()
    const threads = data.threads || []
    
    // Save successful fetch to localStorage
    saveToLocalStorage(userId, threads)
    
    return threads
  } catch (error) {
    // If network fails, try to load from localStorage
    const cachedThreads = loadFromLocalStorage(userId)
    if (cachedThreads) {
      console.log('🔄 Using cached threads from localStorage')
      return cachedThreads
    }
    
    // If no cache available, re-throw the error
    throw error
  }
}

// Create thread function
async function createThread(accessToken: string, title: string): Promise<ChatThread> {
  const response = await fetch('/api/chat/threads', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create thread: ${response.status}`)
  }

  const data = await response.json()
  return data.thread
}

// Delete thread function
async function deleteThread(accessToken: string, threadId: string): Promise<void> {
  const response = await fetch(`/api/chat/threads/${threadId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to delete thread: ${response.status}`)
  }
}

// Main hook for threads
export function useThreads() {
  const { user, session } = useAuth()
  const queryClient = useQueryClient()

  // Query for fetching threads with localStorage backup
  const threadsQuery = useQuery({
    queryKey: threadKeys.list(user?.id || ''),
    queryFn: () => fetchThreads(session!.access_token, user!.id),
    enabled: !!user && !!session?.access_token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    // Add initial data from localStorage if available
    initialData: () => {
      if (!user?.id) return undefined
      const cached = loadFromLocalStorage(user.id)
      return cached || undefined
    },
  })

  // Mutation for creating threads
  const createThreadMutation = useMutation({
    mutationFn: (title: string) => createThread(session!.access_token, title),
    onMutate: async (title) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: threadKeys.list(user?.id || '') })

      // Get current threads
      const previousThreads = queryClient.getQueryData<ChatThread[]>(threadKeys.list(user?.id || ''))

      // Optimistically add new thread
      const tempThread: ChatThread = {
        id: `temp-${Date.now()}`,
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user?.id || '',
        message_count: 0,
      }

      queryClient.setQueryData<ChatThread[]>(threadKeys.list(user?.id || ''), old => [tempThread, ...(old || [])])

      return { previousThreads }
    },
    onError: (err, variables, context) => {
      // Revert optimistic update on error
      queryClient.setQueryData(threadKeys.list(user?.id || ''), context?.previousThreads)
    },
    onSettled: () => {
      // Refetch threads after mutation
      queryClient.invalidateQueries({ queryKey: threadKeys.list(user?.id || '') })
    },
    onSuccess: () => {
      // Update localStorage when thread is created successfully
      const updatedThreads = queryClient.getQueryData<ChatThread[]>(threadKeys.list(user?.id || ''))
      if (updatedThreads && user?.id) {
        saveToLocalStorage(user.id, updatedThreads)
      }
    },
  })

  // Mutation for deleting threads
  const deleteThreadMutation = useMutation({
    mutationFn: (threadId: string) => deleteThread(session!.access_token, threadId),
    onMutate: async (threadId) => {
      await queryClient.cancelQueries({ queryKey: threadKeys.list(user?.id || '') })

      const previousThreads = queryClient.getQueryData<ChatThread[]>(threadKeys.list(user?.id || ''))

      // Optimistically remove thread
      queryClient.setQueryData<ChatThread[]>(threadKeys.list(user?.id || ''), old => 
        old?.filter(thread => thread.id !== threadId) || []
      )

      return { previousThreads }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(threadKeys.list(user?.id || ''), context?.previousThreads)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: threadKeys.list(user?.id || '') })
    },
    onSuccess: () => {
      // Update localStorage when thread is deleted successfully
      const updatedThreads = queryClient.getQueryData<ChatThread[]>(threadKeys.list(user?.id || ''))
      if (updatedThreads && user?.id) {
        saveToLocalStorage(user.id, updatedThreads)
      }
    },
  })

  // Utility function to manually refresh threads
  const refreshThreads = () => {
    queryClient.invalidateQueries({ queryKey: threadKeys.list(user?.id || '') })
  }

  return {
    // Data
    threads: threadsQuery.data || [],
    
    // Loading states
    isLoading: threadsQuery.isLoading,
    isFetching: threadsQuery.isFetching,
    isError: threadsQuery.isError,
    error: threadsQuery.error,
    
    // Mutations
    createThread: createThreadMutation.mutate,
    createThreadAsync: createThreadMutation.mutateAsync,
    deleteThread: deleteThreadMutation.mutate,
    deleteThreadAsync: deleteThreadMutation.mutateAsync,
    isCreating: createThreadMutation.isPending,
    isDeleting: deleteThreadMutation.isPending,
    
    // Utilities
    refreshThreads,
  }
}
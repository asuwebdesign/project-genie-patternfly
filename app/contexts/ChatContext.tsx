'use client'

import { createContext, useContext, useCallback, useState } from 'react'

interface ChatContextType {
  refreshThreads: () => void
  refreshTrigger: number
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refreshThreads = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <ChatContext.Provider value={{ refreshThreads, refreshTrigger }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
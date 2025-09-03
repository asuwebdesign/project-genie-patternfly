'use client'

import React, { Component, ReactNode } from 'react'
import { Alert, Button, Card, CardBody } from '@patternfly/react-core'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

// =============================================================================
// Session Error Boundary
// Catches session-related errors and provides fallback UI
// =============================================================================

export class SessionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('SessionErrorBoundary: Caught error:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SessionErrorBoundary: Error details:', { error, errorInfo })
    
    // Log specific session-related errors
    if (error.message.includes('session') || error.message.includes('auth')) {
      console.error('SessionErrorBoundary: Session-related error detected')
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
    // Force page reload to reinitialize auth
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div style={{ 
          padding: '2rem', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '50vh'
        }}>
          <Card style={{ maxWidth: '500px', width: '100%' }}>
            <CardBody>
              <Alert
                variant="warning"
                title="Session Error"
                style={{ marginBottom: '1rem' }}
              >
                We encountered an issue with your session. This might be due to a 
                network connection problem or session timeout.
              </Alert>
              
              <div style={{ textAlign: 'center' }}>
                <Button
                  variant="primary"
                  onClick={this.handleRetry}
                  style={{ marginRight: '1rem' }}
                >
                  Retry
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.location.href = '/'}
                >
                  Go to Home
                </Button>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details style={{ marginTop: '1rem' }}>
                  <summary>Error Details (Development Only)</summary>
                  <pre style={{ 
                    fontSize: '0.75rem', 
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)',
                    borderRadius: '0.25rem',
                    overflow: 'auto'
                  }}>
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardBody>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// =============================================================================
// Hook for handling session errors in functional components
// =============================================================================

export function useSessionErrorHandler() {
  const handleSessionError = React.useCallback((error: Error) => {
    console.error('Session error handled:', error)
    
    // Check if it's a session timeout or auth error
    if (
      error.message.includes('session') ||
      error.message.includes('auth') ||
      error.message.includes('timeout') ||
      error.message.includes('unauthorized')
    ) {
      // You could trigger a toast notification here
      console.warn('Session-related error detected, consider refreshing auth state')
      return true
    }
    
    return false
  }, [])

  return { handleSessionError }
}

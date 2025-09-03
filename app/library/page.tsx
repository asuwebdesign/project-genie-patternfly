'use client'

import {
  Title,
  Card,
  CardBody,
  EmptyState,
  EmptyStateBody,
} from '@patternfly/react-core'
import { ChatLayout } from '../components/ChatLayout'

export default function LibraryPage() {
  return (
    <ChatLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 0' }}>
        <Title headingLevel="h1" size="2xl" style={{ marginBottom: '1rem' }}>
          Library
        </Title>

        <div style={{ marginBottom: '2rem' }}>
          <p>
            Welcome to the Project Genie Library. This is where you&apos;ll find
            resources, documentation, and tools to help you get the most out of
            your AI assistant.
          </p>
        </div>

        <Card>
          <CardBody>
            <EmptyState>
              <EmptyStateBody>
                <h4>Library coming soon</h4>
                <p>
                  The library feature is currently under development. Check back
                  soon for access to helpful resources, templates, and
                  documentation.
                </p>
              </EmptyStateBody>
            </EmptyState>
          </CardBody>
        </Card>
      </div>
    </ChatLayout>
  )
}

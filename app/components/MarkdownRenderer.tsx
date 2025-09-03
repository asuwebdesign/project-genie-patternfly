'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { CodeBlock, CodeBlockCode, CodeBlockAction } from '@patternfly/react-core'
import 'highlight.js/styles/github-dark.css'

// Type definitions for markdown component props
interface ComponentProps {
  children?: React.ReactNode
  className?: string
  href?: string
}

interface MarkdownRendererProps {
  content: string
  className?: string
}

// =============================================================================
// Markdown Renderer Component
// Renders markdown content with syntax highlighting and GitHub Flavored Markdown
// =============================================================================

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeHighlight, { detect: true, ignoreMissing: true }]
        ]}
        components={{
          // Custom components for better styling
          code(props: ComponentProps) {
            const { className, children, ...rest } = props
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !className || !match
            
            if (isInline) {
              return (
                <code className="inline-code" {...rest}>
                  {children}
                </code>
              )
            }

            // For code blocks, use PatternFly's CodeBlock component
            const codeContent = String(children).replace(/\n$/, '')
            
            const handleCopy = () => {
              navigator.clipboard.writeText(codeContent).catch((err) => {
                console.error('Failed to copy code:', err)
              })
            }

            return (
              <CodeBlock style={{ margin: '1rem 0' }}>
                <CodeBlockCode>
                  <pre>
                    <code className={className} {...rest}>
                      {children}
                    </code>
                  </pre>
                </CodeBlockCode>
                <CodeBlockAction>
                  <button
                    onClick={handleCopy}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.875rem',
                      color: 'var(--pf-v6-global--Color--200)',
                    }}
                    title="Copy code"
                  >
                    Copy
                  </button>
                </CodeBlockAction>
              </CodeBlock>
            )
          },
          blockquote(props: ComponentProps) {
            const { children } = props
            return (
              <blockquote className="markdown-blockquote">
                {children}
              </blockquote>
            )
          },
          table(props: ComponentProps) {
            const { children } = props
            return (
              <div className="table-wrapper">
                <table className="markdown-table">{children}</table>
              </div>
            )
          },
          th(props: ComponentProps) {
            const { children } = props
            return <th className="markdown-th">{children}</th>
          },
          td(props: ComponentProps) {
            const { children } = props
            return <td className="markdown-td">{children}</td>
          },
          ul(props: ComponentProps) {
            const { children } = props
            return <ul className="markdown-ul">{children}</ul>
          },
          ol(props: ComponentProps) {
            const { children } = props
            return <ol className="markdown-ol">{children}</ol>
          },
          li(props: ComponentProps) {
            const { children } = props
            return <li className="markdown-li">{children}</li>
          },
          p(props: ComponentProps) {
            const { children } = props
            return <p className="markdown-p">{children}</p>
          },
          h1(props: ComponentProps) {
            const { children } = props
            return <h1 className="markdown-h1">{children}</h1>
          },
          h2(props: ComponentProps) {
            const { children } = props
            return <h2 className="markdown-h2">{children}</h2>
          },
          h3(props: ComponentProps) {
            const { children } = props
            return <h3 className="markdown-h3">{children}</h3>
          },
          h4(props: ComponentProps) {
            const { children } = props
            return <h4 className="markdown-h4">{children}</h4>
          },
          h5(props: ComponentProps) {
            const { children } = props
            return <h5 className="markdown-h5">{children}</h5>
          },
          h6(props: ComponentProps) {
            const { children } = props
            return <h6 className="markdown-h6">{children}</h6>
          },
          a(props: ComponentProps) {
            const { href, children } = props
            return (
              <a 
                href={href} 
                className="markdown-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

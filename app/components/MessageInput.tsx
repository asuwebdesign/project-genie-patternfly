'use client'

import React, { useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { Button } from '@patternfly/react-core'
// Using a simple arrow icon instead since Send is not available
// import { Send } from '@rhds/icons'

interface MessageInputProps {
  onSend: (content: string) => void
  placeholder?: string
  disabled?: boolean
  isLoading?: boolean
}

// =============================================================================
// Message Input Component
// Rich text editor using TipTap for composing messages
// =============================================================================

export function MessageInput({ 
  onSend, 
  placeholder = 'Type your message...', 
  disabled = false,
  isLoading = false 
}: MessageInputProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'message-link',
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'message-editor-content',
        'data-placeholder': placeholder,
      },
    },
    editable: !disabled,
    immediatelyRender: false,
  })

  const handleSend = useCallback(() => {
    if (!editor) return
    
    const content = editor.getText().trim()
    if (!content || disabled || isLoading) return

    // Send the plain text content
    onSend(content)
    
    // Clear the editor
    editor.commands.clearContent()
    editor.commands.focus()
  }, [editor, onSend, disabled, isLoading])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }, [handleSend])

  // Focus the editor when component mounts
  React.useEffect(() => {
    if (editor && !disabled) {
      editor.commands.focus()
    }
  }, [editor, disabled])

  if (!editor) {
    return null
  }

  return (
    <div className="message-input-container">
      <div 
        ref={editorRef}
        className="message-editor-wrapper"
        onKeyDown={handleKeyDown}
        style={{
          border: '1px solid var(--pf-v6-global--BorderColor--100)',
          borderRadius: '0.375rem',
          minHeight: '3rem',
          maxHeight: '12rem',
          overflow: 'auto',
          padding: '0.75rem',
          backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)',
          transition: 'border-color 0.2s ease',
        }}
        onFocus={() => {
          if (editorRef.current) {
            editorRef.current.style.borderColor = 'var(--pf-v6-global--primary-color--100)'
          }
        }}
        onBlur={() => {
          if (editorRef.current) {
            editorRef.current.style.borderColor = 'var(--pf-v6-global--BorderColor--100)'
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>
      
      <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="primary"
          onClick={handleSend}
          isLoading={isLoading}
          isDisabled={disabled || !editor?.getText().trim()}
        >
          Send Message
        </Button>
      </div>
    </div>
  )
}

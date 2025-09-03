import { NextRequest, NextResponse } from 'next/server'

// =============================================================================
// Mock Ollama API Route
// Temporary implementation for testing
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const { message, model = 'llama3.2' } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Generate mock response based on input
    let response = ''
    if (
      message.toLowerCase().includes('hello') ||
      message.toLowerCase().includes('hi')
    ) {
      response = 'Hello! How can I help you today?'
    } else if (message.toLowerCase().includes('help')) {
      response = "I'm here to help! What would you like to know or discuss?"
    } else if (
      message.toLowerCase().includes('code') ||
      message.toLowerCase().includes('programming')
    ) {
      response =
        'I can help you with programming questions! What language or problem are you working on?'
    } else if (message.toLowerCase().includes('project')) {
      response =
        "Great! I'd love to help you with your project. What are you working on?"
    } else {
      response = `That\'s an interesting question about "${message}". I\'m here to help you explore this topic further. What specific aspect would you like to discuss?`
    }

    return NextResponse.json({
      response,
      model,
      done: true,
    })
  } catch (error) {
    console.error('Error calling Ollama:', error)
    return NextResponse.json(
      { error: 'Failed to get response from Ollama' },
      { status: 500 }
    )
  }
}

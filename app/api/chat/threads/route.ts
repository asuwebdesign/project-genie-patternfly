import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// =============================================================================
// Chat Threads API Route
// Handles CRUD operations for chat threads
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/chat/threads - Starting request')

    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '')

    // Create Supabase client with the token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    // Get user session using the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)
    console.log('Auth check result:', { user: user?.id, error: authError })

    if (authError || !user) {
      console.log('Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated, fetching threads for user:', user.id)

    // Get chat threads for the user
    const { data: threads, error } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    console.log('Supabase query result:', { threads, error })

    if (error) {
      console.error('Error fetching threads:', error)
      return NextResponse.json(
        { error: 'Failed to fetch chat threads' },
        { status: 500 }
      )
    }

    console.log('Successfully fetched threads:', threads?.length || 0)
    return NextResponse.json({ threads })
  } catch (error) {
    console.error('Error in GET /api/chat/threads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/chat/threads - Starting request')

    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '')

    // Create Supabase client with the token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    // Get user session using the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Create new chat thread
    const { data: thread, error } = await supabase
      .from('chat_threads')
      .insert({
        user_id: user.id,
        title,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating thread:', error)
      return NextResponse.json(
        { error: 'Failed to create chat thread' },
        { status: 500 }
      )
    }

    return NextResponse.json({ thread })
  } catch (error) {
    console.error('Error in POST /api/chat/threads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

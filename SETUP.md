# Project Genie Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Ollama Configuration
OLLAMA_URL=http://localhost:11434
```

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Enable Google OAuth in Authentication > Providers
3. Run the SQL scripts in the `/supabase` folder to create the required tables:
   - `user-profiles.sql` - Creates the profiles table
   - `chat-system-security-policies.sql` - Creates chat tables and policies

## Ollama Setup

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Start the Ollama service
3. Pull a model: `ollama pull llama3.2`

## Development

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000)

## Features

- **Authentication**: Google OAuth via Supabase
- **Chat**: AI-powered conversations with Ollama
- **Threads**: Persistent chat history
- **Search**: Find and navigate chat threads
- **Library**: Placeholder for future features
- **Responsive**: Mobile-friendly design with PatternFly

## Architecture

- **Frontend**: Next.js 15 with TypeScript
- **UI**: PatternFly React components
- **Database**: Supabase (PostgreSQL)
- **AI**: Local Ollama server
- **Authentication**: Supabase Auth with Google OAuth

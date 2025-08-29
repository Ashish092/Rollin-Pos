import { redirect } from 'next/navigation'

export default function HomePage() {
  // Check if Supabase environment variables are configured
  const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuration Error</h1>
            <p className="text-gray-600 mb-4">
              Supabase environment variables are not configured. Please set the following environment variables:
            </p>
            <div className="bg-gray-100 p-4 rounded-md text-left text-sm">
              <code>NEXT_PUBLIC_SUPABASE_URL</code><br/>
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  redirect('/login')
}



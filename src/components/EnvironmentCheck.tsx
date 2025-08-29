'use client'

import { useEffect, useState } from 'react'

export default function EnvironmentCheck() {
  const [envStatus, setEnvStatus] = useState<{
    supabaseUrl: boolean
    supabaseKey: boolean
    nodeEnv: string
  }>({
    supabaseUrl: false,
    supabaseKey: false,
    nodeEnv: 'unknown'
  })

  useEffect(() => {
    setEnvStatus({
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV || 'unknown'
    })
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-md text-xs">
      <div className="font-bold mb-1">Environment Status:</div>
      <div>SUPABASE_URL: {envStatus.supabaseUrl ? '✅' : '❌'}</div>
      <div>SUPABASE_KEY: {envStatus.supabaseKey ? '✅' : '❌'}</div>
      <div>NODE_ENV: {envStatus.nodeEnv}</div>
    </div>
  )
}

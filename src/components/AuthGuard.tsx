'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface AuthGuardProps {
	children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(true)
	const [isAuthed, setIsAuthed] = useState(false)

	useEffect(() => {
		let mounted = true

		const init = async () => {
			try {
				const { data } = await supabase.auth.getSession()
				if (!mounted) return
				
				if (!data.session) {
					setIsAuthed(false)
					setIsLoading(false)
					router.replace('/login')
					return
				}
				
				setIsAuthed(true)
				setIsLoading(false)
			} catch (error) {
				console.error('Auth check failed:', error)
				if (!mounted) return
				setIsAuthed(false)
				setIsLoading(false)
				router.replace('/login')
			}
		}

		init()

		const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
			if (!mounted) return
			if (!session) {
				setIsAuthed(false)
				router.replace('/login')
			} else {
				setIsAuthed(true)
			}
		})

		return () => {
			mounted = false
			sub.subscription.unsubscribe()
		}
	}, [router])

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
			</div>
		)
	}

	if (!isAuthed) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
					<p className="text-gray-600">Redirecting to login...</p>
				</div>
			</div>
		)
	}

	return <>{children}</>
}

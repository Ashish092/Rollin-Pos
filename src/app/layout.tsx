import './globals.css'
import type { Metadata } from 'next'
import ErrorBoundary from '@/components/ErrorBoundary'
import EnvironmentCheck from '@/components/EnvironmentCheck'

export const metadata: Metadata = {
	title: 'POSS Admin',
	description: 'Simple POS & bookkeeping admin dashboard',
	icons: {
		icon: '/favicon.ico',
	},
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="bg-gray-50 text-gray-900">
				<ErrorBoundary>
					{children}
					<EnvironmentCheck />
				</ErrorBoundary>
			</body>
		</html>
	)
}

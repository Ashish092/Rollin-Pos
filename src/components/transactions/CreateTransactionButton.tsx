'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function CreateTransactionButton() {
	return (
		<Link
			href="/transactions/new"
			className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			<Plus className="w-4 h-4 mr-2" />
			Create Transaction
		</Link>
	)
}

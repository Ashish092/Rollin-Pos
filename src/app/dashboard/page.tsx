'use client'
import DashboardLayout from '@/components/DashboardLayout'
import AuthGuard from '@/components/AuthGuard'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [cashTotal, setCashTotal] = useState(0)
  const [savingsTotal, setSavingsTotal] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const [cashRes, savingsRes] = await Promise.all([
          fetch('/api/cash-balance'),
          fetch('/api/savings-accounts')
        ])

        if (cashRes.ok) {
          const cashData = await cashRes.json()
          const sumCash = (Array.isArray(cashData) ? cashData : []).reduce((acc: number, r: { current_balance: number | string }) => acc + (Number(r.current_balance) || 0), 0)
          setCashTotal(sumCash)
        }

        if (savingsRes.ok) {
          const savingsData = await savingsRes.json()
          const sumSavings = (Array.isArray(savingsData) ? savingsData : []).reduce((acc: number, r: { current_balance: number | string }) => acc + (Number(r.current_balance) || 0), 0)
          setSavingsTotal(sumSavings)
        }
      } catch {
        setCashTotal(0)
        setSavingsTotal(0)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const formatAmount = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Overview of balances</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Cash in Hand (All Stores)</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{loading ? '—' : formatAmount(cashTotal)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Savings Accounts Total</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{loading ? '—' : formatAmount(savingsTotal)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Grand Total</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">{loading ? '—' : formatAmount(cashTotal + savingsTotal)}</p>
            </div>
          </div>
        </div>

        <Link
          href="/transactions"
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Create Transaction"
        >
          <Plus className="w-6 h-6" />
        </Link>
      </DashboardLayout>
    </AuthGuard>
  )
}

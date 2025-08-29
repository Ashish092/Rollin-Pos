'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DollarSign,Save, X } from 'lucide-react'
import CreateDailySnapshotButton from './CreateDailySnapshotButton'

interface CashBalance {
  id: number
  store_id: number
  current_balance: number
  last_updated: string
  stores: {
    store_id: string
    branch: string
  }
}

interface CashHistory {
  id: number
  store_id: number
  date: string
  opening_balance: number
  closing_balance: number
  total_income: number
  total_expense: number
  total_transfer: number
  net_change: number
  created_at: string
  stores: {
    store_id: string
    branch: string
  }
}

export default function CashInHandCard() {
  const [cashBalances, setCashBalances] = useState<CashBalance[]>([])
  const [cashHistory, setCashHistory] = useState<CashHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStore, setEditingStore] = useState<number | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [selectedStore, setSelectedStore] = useState<number | null>(null)

  useEffect(() => {
    fetchCashData()
  }, [])

  const fetchCashData = async () => {
    try {
      // Fetch current balances for all active stores
      const { data: balances, error: balanceError } = await supabase
        .from('cash_balance')
        .select(`
          *,
          stores!inner (
            store_id,
            branch
          )
        `)
        .eq('stores.status', 'active')
        .order('store_id')

      if (balanceError) {
        console.error('Error fetching cash balances:', balanceError)
      } else {
        setCashBalances(balances || [])
        if (balances && balances.length > 0) {
          setSelectedStore(balances[0].store_id)
        }
      }

      // Fetch recent history
      const { data: history, error: historyError } = await supabase
        .from('cash_history')
        .select(`
          *,
          stores (
            store_id,
            branch
          )
        `)
        .order('date', { ascending: false })
        .limit(10)

      if (historyError) {
        console.error('Error fetching cash history:', historyError)
      } else {
        setCashHistory(history || [])
      }
    } catch (error) {
      console.error('Error fetching cash data:', error)
    } finally {
      setLoading(false)
    }
  }



  const handleSaveBalance = async () => {
    if (!editingStore || !editAmount) return

    try {
      const newAmount = parseFloat(editAmount)
      if (isNaN(newAmount)) {
        alert('Please enter a valid amount')
        return
      }

      const response = await fetch('/api/cash-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store_id: editingStore,
          amount: newAmount,
          type: 'adjustment'
        }),
      })

      if (response.ok) {
        await fetchCashData()
        setEditingStore(null)
        setEditAmount('')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update balance')
      }
    } catch (error) {
      console.error('Error updating balance:', error)
      alert('Failed to update balance')
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getTotalCash = () => {
    return cashBalances.reduce((total, balance) => total + balance.current_balance, 0)
  }



  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Cash in Hand</h3>
        </div>
        <div className="text-center py-4 text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Cash in Hand</h3>
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <span className="text-xl font-bold text-green-600">
            {formatAmount(getTotalCash())}
          </span>
        </div>
      </div>

      {/* Store Balances */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-medium text-gray-700">Store Balances</h4>
        {cashBalances.map((balance) => (
          <div key={balance.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-3">
            <div>
              <div className="font-medium text-gray-900">
                {balance.stores?.branch} ({balance.stores?.store_id})
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {formatDate(balance.last_updated)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {editingStore === balance.store_id ? (
                <>
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full sm:w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={handleSaveBalance}
                    className="p-1 text-green-600 hover:text-green-800"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingStore(null)
                      setEditAmount('')
                    }}
                    className="p-1 text-gray-600 hover:text-gray-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <span className="text-lg font-semibold text-gray-900">
                  {formatAmount(balance.current_balance)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>



             {/* Daily Snapshot Button */}
       <div className="mt-4">
         <CreateDailySnapshotButton 
           storeId={selectedStore || undefined} 
           onSnapshotCreated={fetchCashData}
         />
       </div>

       {/* Recent History */}
       <div>
         <h4 className="text-sm font-medium text-gray-700 mb-3">Recent History</h4>
         <div className="space-y-2 max-h-40 overflow-y-auto">
           {cashHistory.slice(0, 5).map((history) => (
             <div key={history.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-gray-50 rounded text-sm gap-2">
               <div>
                 <div className="font-medium">{history.stores?.branch}</div>
                 <div className="text-gray-500">{formatDateTime(history.created_at)}</div>
               </div>
               <div className="text-left sm:text-right">
                 <div className="font-medium">{formatAmount(history.closing_balance)}</div>
                 <div className={`text-xs ${history.net_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                   {history.net_change >= 0 ? '+' : ''}{formatAmount(history.net_change)}
                 </div>
               </div>
             </div>
           ))}
         </div>
       </div>
    </div>
  )
}

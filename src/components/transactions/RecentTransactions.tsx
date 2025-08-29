'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search} from 'lucide-react'

interface Transaction {
  id: number
  store_id: number
  type: 'income' | 'expense' | 'transfer'
  category: string
  amount: number
  payment_method: string
  notes: string
  transaction_date: string
  staff_email: string
  created_at: string
  stores?: {
    store_id: string
    branch: string
  } | null
}

interface Transfer {
  id: number
  transfer_reference: string
  from_type: 'store' | 'savings'
  from_id: number
  to_type: 'store' | 'savings'
  to_id: number
  amount: number
  notes: string
  transaction_date: string
  staff_email: string
  created_at: string
  outgoing_transaction: Transaction
  incoming_transaction: Transaction
}

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchTransactions()
    fetchTransfers()
  }, [])

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          stores:store_id(store_id, branch)
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching transactions:', error)
      } else {
        setTransactions((data as Transaction[]) || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransfers = async () => {
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select(`
          *,
          outgoing_transaction:transactions!outgoing_transaction_id(*, stores:store_id(store_id, branch)),
          incoming_transaction:transactions!incoming_transaction_id(*, stores:store_id(store_id, branch))
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        // If table doesn't exist yet or no access, just fallback to empty transfers without noisy logs
        setTransfers([])
      } else {
        setTransfers((data as Transfer[]) || [])
      }
    } catch {
      // Network or unexpected error: fallback silently
      setTransfers([])
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }



  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.stores?.branch.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterType === 'all' || transaction.type === filterType

    return matchesSearch && matchesFilter
  })

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
        break
      case 'amount':
        comparison = a.amount - b.amount
        break
      case 'category':
        comparison = a.category.localeCompare(b.category)
        break
      default:
        comparison = 0
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const displayTransactions = sortedTransactions.slice(0, 10)

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        <p className="text-sm text-gray-600 mt-1">Latest transaction activity</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field)
                setSortOrder(order as 'asc' | 'desc')
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
              <option value="category-asc">Category (A-Z)</option>
              <option value="category-desc">Category (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="divide-y divide-gray-200">
        {displayTransactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No transactions found
          </div>
        ) : (
          displayTransactions.map((transaction) => (
            <div key={transaction.id} className="p-4 sm:p-6 hover:bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                    <div className={`w-2 h-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-500' : 
                      transaction.type === 'expense' ? 'bg-red-500' : 'bg-blue-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {transaction.category.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {transaction.stores?.branch || 'N/A'} • {transaction.payment_method}
                      </p>
                    </div>
                  </div>
                  {transaction.notes && (
                    <p className="text-sm text-gray-500 mt-1">{transaction.notes}</p>
                  )}
                </div>
                <div className="text-left sm:text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 
                    transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-sm text-gray-500">{formatDate(transaction.transaction_date)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Transfers Section */}
      {transfers.length > 0 && (
        <>
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <h4 className="text-md font-semibold text-gray-900">Recent Transfers</h4>
            <p className="text-sm text-gray-600 mt-1">Fund transfers between accounts</p>
          </div>
          <div className="divide-y divide-gray-200">
                            {transfers.slice(0, 5).map((transfer) => (
              <div key={transfer.id} className="p-4 sm:p-6 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Transfer: {transfer.transfer_reference}
                        </p>
                        <p className="text-sm text-gray-600">
                          {transfer.from_type === 'store' ? 'Store' : 'Savings'} → {transfer.to_type === 'store' ? 'Store' : 'Savings'}
                        </p>
                      </div>
                    </div>
                    {transfer.notes && (
                      <p className="text-sm text-gray-500 mt-1">{transfer.notes}</p>
                    )}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(transfer.amount)}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(transfer.transaction_date)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

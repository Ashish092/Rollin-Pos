'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ArrowRight, DollarSign } from 'lucide-react'

interface Store {
  id: number
  store_id: string
  branch: string
  status: string
}

interface SavingsAccount {
  id: number
  account_id: string
  account_name: string
  account_type: string
  current_balance: number
  status: string
}

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  onTransfer: (transferData: {
    fromType: 'store' | 'savings'
    fromId: number
    toType: 'store' | 'savings'
    toId: number
    amount: number
    notes: string
  }) => void
}

export default function TransferModal({ isOpen, onClose, onTransfer }: TransferModalProps) {
  const [stores, setStores] = useState<Store[]>([])
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fromType: 'store' as 'store' | 'savings',
    fromId: '',
    toType: 'savings' as 'store' | 'savings',
    toId: '',
    amount: '',
    notes: ''
  })
  const [fromAccountBalance, setFromAccountBalance] = useState<number | null>(null)
  const [toAccountBalance, setToAccountBalance] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchStores()
      fetchSavingsAccounts()
    }
  }, [isOpen])

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores')
      if (response.ok) {
        const data = await response.json()
        setStores(data.filter((store: Store) => store.status === 'active'))
      }
    } catch (error) {
      console.error('Error fetching stores:', error)
    }
  }

  const fetchSavingsAccounts = async () => {
    try {
      const response = await fetch('/api/savings-accounts')
      if (response.ok) {
        const data = await response.json()
        setSavingsAccounts(data.filter((account: SavingsAccount) => account.status === 'active'))
      }
    } catch (error) {
      console.error('Error fetching savings accounts:', error)
    }
  }

  const fetchFromAccountBalance = useCallback(async () => {
    if (!formData.fromId) {
      setFromAccountBalance(null)
      return
    }

    try {
      if (formData.fromType === 'store') {
        const response = await fetch('/api/cash-balance')
        if (response.ok) {
          const data = await response.json()
          const storeBalance = data.find((balance: { store_id: number; current_balance: number }) => balance.store_id === parseInt(formData.fromId))
          setFromAccountBalance(storeBalance ? storeBalance.current_balance : 0)
        }
      } else {
        const account = savingsAccounts.find(acc => acc.id === parseInt(formData.fromId))
        setFromAccountBalance(account ? account.current_balance : 0)
      }
    } catch (error) {
      console.error('Error fetching from account balance:', error)
      setFromAccountBalance(null)
    }
  }, [formData.fromId, formData.fromType, savingsAccounts])

  const fetchToAccountBalance = useCallback(async () => {
    if (!formData.toId) {
      setToAccountBalance(null)
      return
    }

    try {
      if (formData.toType === 'store') {
        const response = await fetch('/api/cash-balance')
        if (response.ok) {
          const data = await response.json()
          const storeBalance = data.find((balance: { store_id: number; current_balance: number }) => balance.store_id === parseInt(formData.toId))
          setToAccountBalance(storeBalance ? storeBalance.current_balance : 0)
        }
      } else {
        const account = savingsAccounts.find(acc => acc.id === parseInt(formData.toId))
        setToAccountBalance(account ? account.current_balance : 0)
      }
    } catch (error) {
      console.error('Error fetching to account balance:', error)
      setToAccountBalance(null)
    }
  }, [formData.toId, formData.toType, savingsAccounts])

  useEffect(() => {
    fetchFromAccountBalance()
  }, [fetchFromAccountBalance])

  useEffect(() => {
    fetchToAccountBalance()
  }, [fetchToAccountBalance])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.fromId || !formData.toId || !formData.amount) {
      alert('Please fill in all required fields')
      return
    }

    if (formData.fromType === formData.toType && formData.fromId === formData.toId) {
      alert('From and To accounts cannot be the same')
      return
    }

    const amount = parseFloat(formData.amount)
    if (amount <= 0) {
      alert('Amount must be greater than 0')
      return
    }

    // Check if transfer amount exceeds available balance
    if (fromAccountBalance !== null && amount > fromAccountBalance) {
      alert(`Transfer amount (${amount}) exceeds available balance (${fromAccountBalance})`)
      return
    }

    setLoading(true)
    
    try {
      onTransfer({
        fromType: formData.fromType,
        fromId: parseInt(formData.fromId),
        toType: formData.toType,
        toId: parseInt(formData.toId),
        amount,
        notes: formData.notes
      })
      
      // Reset form
      setFormData({
        fromType: 'store',
        fromId: '',
        toType: 'savings',
        toId: '',
        amount: '',
        notes: ''
      })
      
      onClose()
    } catch (error) {
      console.error('Error processing transfer:', error)
      alert('Failed to process transfer')
    } finally {
      setLoading(false)
    }
  }

  const getFromOptions = () => {
    if (formData.fromType === 'store') {
      return stores.map(store => ({
        id: store.id,
        name: `${store.branch} (${store.store_id})`,
        balance: 'Cash in Hand'
      }))
    } else {
      return savingsAccounts.map(account => ({
        id: account.id,
        name: `${account.account_name} (${account.account_id})`,
        balance: `$${account.current_balance.toLocaleString()}`
      }))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getToOptions = () => {
    if (formData.toType === 'store') {
      return stores.map(store => ({
        id: store.id,
        name: `${store.branch} (${store.store_id})`,
        balance: 'Cash in Hand'
      }))
    } else {
      return savingsAccounts.map(account => ({
        id: account.id,
        name: `${account.account_name} (${account.account_id})`,
        balance: `$${account.current_balance.toLocaleString()}`
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Transfer Funds</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* From Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Account *
              </label>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="store"
                      checked={formData.fromType === 'store'}
                      onChange={(e) => setFormData({ ...formData, fromType: e.target.value as 'store' | 'savings', fromId: '' })}
                      className="mr-2"
                    />
                    Store Cash
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="savings"
                      checked={formData.fromType === 'savings'}
                      onChange={(e) => setFormData({ ...formData, fromType: e.target.value as 'store' | 'savings', fromId: '' })}
                      className="mr-2"
                    />
                    Savings Account
                  </label>
                </div>
                <select
                  value={formData.fromId}
                  onChange={(e) => setFormData({ ...formData, fromId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select account</option>
                  {getFromOptions().map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} - {option.balance}
                    </option>
                  ))}
                </select>
                {fromAccountBalance !== null && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                    <span className="font-medium">Available Balance:</span> {formatCurrency(fromAccountBalance)}
                  </div>
                )}
              </div>
            </div>

            {/* Transfer Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-6 h-6 text-gray-400" />
            </div>

            {/* To Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Account *
              </label>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="store"
                      checked={formData.toType === 'store'}
                      onChange={(e) => setFormData({ ...formData, toType: e.target.value as 'store' | 'savings', toId: '' })}
                      className="mr-2"
                    />
                    Store Cash
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="savings"
                      checked={formData.toType === 'savings'}
                      onChange={(e) => setFormData({ ...formData, toType: e.target.value as 'store' | 'savings', toId: '' })}
                      className="mr-2"
                    />
                    Savings Account
                  </label>
                </div>
                <select
                  value={formData.toId}
                  onChange={(e) => setFormData({ ...formData, toId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select account</option>
                  {getToOptions().map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} - {option.balance}
                    </option>
                  ))}
                </select>
                {toAccountBalance !== null && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                    <span className="font-medium">Current Balance:</span> {formatCurrency(toAccountBalance)}
                  </div>
                )}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-10 pr-16 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                  {fromAccountBalance !== null && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, amount: fromAccountBalance.toString() })}
                      className="absolute right-2 top-1.5 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Max
                    </button>
                  )}
                </div>
                {fromAccountBalance !== null && (
                  <div className="text-xs text-gray-500">
                    Maximum transfer amount: {formatCurrency(fromAccountBalance)}
                  </div>
                )}
              </div>
            </div>

            {/* Transfer Summary */}
            {formData.amount && fromAccountBalance !== null && toAccountBalance !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Transfer Summary</h4>
                <div className="space-y-1 text-xs text-blue-800">
                  <div>From: {formatCurrency(fromAccountBalance)} → {formatCurrency(fromAccountBalance - parseFloat(formData.amount) || 0)}</div>
                  <div>To: {formatCurrency(toAccountBalance)} → {formatCurrency(toAccountBalance + parseFloat(formData.amount) || 0)}</div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Transfer description..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Transfer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

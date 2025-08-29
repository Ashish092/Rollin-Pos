'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import AuthGuard from '@/components/AuthGuard'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save} from 'lucide-react'
import TransferModal from '@/components/transactions/TransferModal'

interface Store {
  id: number
  store_id: string
  branch: string
}

const EXPENSE_CATEGORIES = [
  'rent',
  'wages',
  'salary',
  'utilities',
  'saasbills',
  'courier',
  'carrier',
  'custom'
]

const INCOME_CATEGORIES = [
  'sales',
  'return',
  'custom'
]

const PAYMENT_METHODS = [
  'cash',
  'online',
  'custom'
]

export default function NewTransactionPage() {
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [formData, setFormData] = useState({
    store_id: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    category: '',
    customCategory: '',
    amount: '',
    payment_method: 'cash',
    customPaymentMethod: '',
    notes: '',
    transaction_date: new Date().toISOString().split('T')[0],
    staff_email: ''
  })

  useEffect(() => {
    fetchStores()
    fetchCurrentUser()
  }, [])

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, store_id, branch')
        .eq('status', 'active')
        .order('branch')

      if (error) {
        console.error('Error fetching stores:', error)
      } else {
        setStores(data || [])
      }
    } catch (error) {
      console.error('Error fetching stores:', error)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setFormData(prev => ({ ...prev, staff_email: user.email || '' }))
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getCategories = () => {
    return formData.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  }

  const getPaymentMethods = () => {
    return PAYMENT_METHODS
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const finalCategory = formData.category === 'custom' ? formData.customCategory : formData.category
      const finalPaymentMethod = formData.payment_method === 'custom' ? formData.customPaymentMethod : formData.payment_method

      if (!formData.store_id || !formData.category || !formData.amount || !formData.payment_method) {
        alert('Please fill in all required fields')
        setLoading(false)
        return
      }

      if ((formData.category === 'custom' && !formData.customCategory) || 
          (formData.payment_method === 'custom' && !formData.customPaymentMethod)) {
        alert('Please fill in custom fields')
        setLoading(false)
        return
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store_id: parseInt(formData.store_id),
          type: formData.type,
          category: finalCategory,
          amount: parseFloat(formData.amount),
          payment_method: finalPaymentMethod,
          notes: formData.notes,
          transaction_date: formData.transaction_date,
          staff_email: formData.staff_email
        }),
      })

      if (response.ok) {
        router.push('/transactions')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create transaction')
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      alert('Failed to create transaction')
    } finally {
      setLoading(false)
    }
  }

  const handleTransfer = async (transferData: {
    fromType: 'store' | 'savings'
    fromId: number
    toType: 'store' | 'savings'
    toId: number
    amount: number
    notes: string
  }) => {
    try {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...transferData,
          staff_email: formData.staff_email
        }),
      })

      if (response.ok) {
        router.push('/transactions')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to process transfer')
      }
    } catch (error) {
      console.error('Error processing transfer:', error)
      alert('Failed to process transfer')
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">New Transaction</h1>
                <p className="text-gray-600">Create a new transaction record</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Store Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store {formData.type !== 'transfer' ? '*' : ''}
                </label>
                <select
                  value={formData.store_id}
                  onChange={(e) => handleInputChange('store_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={formData.type !== 'transfer'}
                >
                  <option value="">Select a store</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.branch} ({store.store_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type *
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => handleInputChange('type', 'expense')}
                    className={`px-4 py-2 rounded-md border transition-colors ${
                      formData.type === 'expense'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('type', 'income')}
                    className={`px-4 py-2 rounded-md border transition-colors ${
                      formData.type === 'income'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('type', 'transfer')
                      setShowTransferModal(true)
                    }}
                    className={`px-4 py-2 rounded-md border transition-colors ${
                      formData.type === 'transfer'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Transfer {showTransferModal && formData.type === 'transfer' && '✓'}
                  </button>
                </div>
              </div>

              {/* Transfer Message */}
              {formData.type === 'transfer' && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    Transfer modal is open. Please complete the transfer in the popup window.
                  </p>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category {formData.type !== 'transfer' ? '*' : ''}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={formData.type !== 'transfer'}
                >
                  <option value="">Select category</option>
                  {getCategories().map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Category */}
              {formData.category === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Category {formData.type !== 'transfer' ? '*' : ''}
                  </label>
                  <input
                    type="text"
                    value={formData.customCategory}
                    onChange={(e) => handleInputChange('customCategory', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter custom category"
                    required={formData.type !== 'transfer'}
                  />
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => handleInputChange('payment_method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select payment method</option>
                  {getPaymentMethods().map((method) => (
                    <option key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Payment Method */}
              {formData.payment_method === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Payment Method *
                  </label>
                  <input
                    type="text"
                    value={formData.customPaymentMethod}
                    onChange={(e) => handleInputChange('customPaymentMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter custom payment method"
                    required
                  />
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => handleInputChange('transaction_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>

              {/* Staff Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staff Email
                </label>
                <input
                  type="email"
                  value={formData.staff_email}
                  onChange={(e) => handleInputChange('staff_email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="staff@example.com"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Transfer Modal */}
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false)
            // Reset to expense if transfer is cancelled
            if (formData.type === 'transfer') {
              handleInputChange('type', 'expense')
            }
          }}
          onTransfer={handleTransfer}
        />
      </DashboardLayout>
    </AuthGuard>
  )
}

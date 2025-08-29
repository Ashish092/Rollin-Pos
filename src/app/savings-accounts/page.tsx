'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import AuthGuard from '@/components/AuthGuard'
import { Plus, Edit, Trash2} from 'lucide-react'

interface SavingsAccount {
  id: number
  account_id: string
  account_name: string
  account_type: string
  bank_name: string | null
  account_number: string | null
  current_balance: number
  status: string
  notes: string | null
  created_at: string
}

export default function SavingsAccountsPage() {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<SavingsAccount | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState<SavingsAccount | null>(null)
  const [formData, setFormData] = useState({
    account_id: '',
    account_name: '',
    account_type: 'bank',
    bank_name: '',
    account_number: '',
    current_balance: '',
    notes: ''
  })
  const [transfers, setTransfers] = useState<Array<{
    id: number
    transaction_date: string
    from_type: string
    to_type: string
    amount: number
    notes?: string
    transfer_reference: string
  }>>([])

  const ACCOUNT_TYPES = [
    { value: 'bank', label: 'Bank Account' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'digital_wallet', label: 'Digital Wallet' },
    { value: 'other', label: 'Other' }
  ]

  useEffect(() => {
    fetchAccounts()
    fetchTransfers()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/savings-accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      } else {
        console.error('Failed to fetch accounts')
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransfers = async () => {
    try {
      const res = await fetch('/api/transfers')
      if (res.ok) {
        const data = await res.json()
        setTransfers(Array.isArray(data) ? data.slice(0, 5) : [])
      } else {
        setTransfers([])
      }
    } catch {
      setTransfers([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingAccount 
        ? `/api/savings-accounts/${editingAccount.id}`
        : '/api/savings-accounts'
      
      const method = editingAccount ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          current_balance: parseFloat(formData.current_balance) || 0
        }),
      })

      if (response.ok) {
        setShowModal(false)
        setEditingAccount(null)
        resetForm()
        fetchAccounts()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save account')
      }
    } catch (error) {
      console.error('Error saving account:', error)
      alert('Failed to save account')
    }
  }

  const handleEdit = (account: SavingsAccount) => {
    setEditingAccount(account)
    setFormData({
      account_id: account.account_id,
      account_name: account.account_name,
      account_type: account.account_type,
      bank_name: account.bank_name || '',
      account_number: account.account_number || '',
      current_balance: account.current_balance.toString(),
      notes: account.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!deletingAccount) return

    try {
      const response = await fetch(`/api/savings-accounts/${deletingAccount.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setShowDeleteModal(false)
        setDeletingAccount(null)
        fetchAccounts()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account')
    }
  }

  const resetForm = () => {
    setFormData({
      account_id: '',
      account_name: '',
      account_type: 'bank',
      bank_name: '',
      account_number: '',
      current_balance: '',
      notes: ''
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getAccountTypeLabel = (type: string) => {
    return ACCOUNT_TYPES.find(t => t.value === type)?.label || type
  }

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Savings Accounts</h1>
              <p className="text-gray-600">Manage your savings accounts and balances</p>
            </div>
            <button
              onClick={() => {
                setEditingAccount(null)
                resetForm()
                setShowModal(true)
              }}
              className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </button>
          </div>

          {/* Accounts Table - Desktop */}
          <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {account.account_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {account.account_id}
                          </div>
                          {account.bank_name && (
                            <div className="text-xs text-gray-400">
                              {account.bank_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getAccountTypeLabel(account.account_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatAmount(account.current_balance)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          account.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {account.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(account)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingAccount(account)
                              setShowDeleteModal(true)
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Accounts Cards - Mobile */}
          <div className="lg:hidden space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {account.account_name}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        account.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {account.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{account.account_id}</p>
                    {account.bank_name && (
                      <p className="text-xs text-gray-400 mb-2">{account.bank_name}</p>
                    )}
                    <div className="flex items-center space-x-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getAccountTypeLabel(account.account_type)}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatAmount(account.current_balance)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(account)}
                      className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingAccount(account)
                        setShowDeleteModal(true)
                      }}
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Transfers */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transfers</h3>
              <p className="text-sm text-gray-600 mt-1">Latest movements between cash and savings</p>
            </div>
            {transfers.length === 0 ? (
              <div className="p-6 text-gray-500">No transfers yet</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {transfers.map((t) => (
                  <div key={t.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm text-gray-600">{new Date(t.transaction_date).toLocaleDateString()}</p>
                      <p className="font-medium text-gray-900">{t.from_type === 'store' ? 'Store' : 'Savings'} → {t.to_type === 'store' ? 'Store' : 'Savings'}</p>
                      {t.notes && <p className="text-sm text-gray-500 mt-1">{t.notes}</p>}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-blue-600">{formatAmount(t.amount)}</div>
                      <div className="text-xs text-gray-500">Ref: {t.transfer_reference}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add/Edit Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/70 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingAccount ? 'Edit Account' : 'Add New Account'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account ID *</label>
                      <input
                        type="text"
                        value={formData.account_id}
                        onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account Name *</label>
                      <input
                        type="text"
                        value={formData.account_name}
                        onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account Type *</label>
                      <select
                        value={formData.account_type}
                        onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {ACCOUNT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                      <input
                        type="text"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account Number</label>
                      <input
                        type="text"
                        value={formData.account_number}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Current Balance</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.current_balance}
                        onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowModal(false)
                          setEditingAccount(null)
                          resetForm()
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        {editingAccount ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && deletingAccount && (
            <div className="fixed inset-0 bg-black/70 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Account</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Are you sure you want to delete &quot;{deletingAccount.account_name}&quot;? This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowDeleteModal(false)
                        setDeletingAccount(null)
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

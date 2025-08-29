import DashboardLayout from '@/components/DashboardLayout'
import AuthGuard from '@/components/AuthGuard'
import CreateTransactionButton from '@/components/transactions/CreateTransactionButton'
import CashInHandCard from '@/components/transactions/CashInHandCard'
import RecentTransactions from '@/components/transactions/RecentTransactions'

export default function TransactionsPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
              <p className="text-gray-600">Manage your transactions and cash flow</p>
            </div>
            <CreateTransactionButton />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <RecentTransactions />
            </div>
            <div className="lg:col-span-1 order-1 lg:order-2">
              <CashInHandCard />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

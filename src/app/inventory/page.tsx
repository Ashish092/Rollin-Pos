import DashboardLayout from '@/components/DashboardLayout'
import AuthGuard from '@/components/AuthGuard'

export default function InventoryPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-600">Track and manage your stock</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">Inventory management coming soon...</p>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

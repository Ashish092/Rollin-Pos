import DashboardLayout from '@/components/DashboardLayout'

export default function UsersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">User management coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  )
}



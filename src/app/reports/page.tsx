import DashboardLayout from '@/components/DashboardLayout'

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">View business reports and analytics</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">Reports and analytics coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  )
}

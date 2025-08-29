import Sidebar from './Sidebar'
import TopBar from './TopBar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="pt-16 lg:pt-16 lg:ml-64 p-4 lg:p-6">
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout

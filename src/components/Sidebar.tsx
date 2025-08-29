'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { 
  LayoutDashboard, 
  Settings, 
  
  Store,
  Receipt,
  Calendar,
  Users,
  Boxes,
  Wallet,
  Menu,
  X,
  Zap
} from 'lucide-react'

const Sidebar = () => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Store, label: 'Stores', href: '/stores' },
    { icon: Wallet, label: 'Savings Accounts', href: '/savings-accounts' },
    { icon: Boxes, label: 'Inventory', href: '/inventory' },
    { icon: Receipt, label: 'Transactions', href: '/transactions' },
    { icon: Calendar, label: 'Reports', href: '/reports' },
    { icon: Users, label: 'Users', href: '/users' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ]

  const handleNavClick = () => {
    setIsOpen(false)
  }

  return (
    <>
             {/* Desktop Sidebar - Always visible */}
       <div className="hidden lg:block w-64 h-screen bg-gray-900 text-white fixed left-0 top-0 z-30">
         <div className="p-6">
           <div className="flex items-center space-x-2">
             <Zap className="w-6 h-6 text-blue-400" />
             <h1 className="text-xl font-bold">Rollin Kicks</h1>
           </div>
         </div>
        
        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-6 py-3 text-sm transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-md"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

             {/* Mobile Sidebar - Slides in from left */}
       <div className={`
         lg:hidden fixed top-0 left-0 h-full bg-gray-900 text-white z-40
         transform transition-transform duration-300 ease-in-out
         w-1/2 max-w-xs
         ${isOpen ? 'translate-x-0' : '-translate-x-full'}
       `}>
         <div className="p-6">
           <div className="flex items-center space-x-2">
             <Zap className="w-6 h-6 text-blue-400" />
             <h1 className="text-xl font-bold">Rollin Kicks</h1>
           </div>
         </div>
        
        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center px-6 py-3 text-sm transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

             {/* Mobile overlay */}
       {isOpen && (
         <div 
           className="lg:hidden fixed inset-0 bg-transparent z-30"
           onClick={() => setIsOpen(false)}
         />
       )}
    </>
  )
}

export default Sidebar

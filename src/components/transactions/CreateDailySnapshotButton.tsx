'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Save, Clock, Settings } from 'lucide-react'

// Extend Window interface for TypeScript
declare global {
  interface Window {
    autoSnapshotInterval?: NodeJS.Timeout | null
  }
}

interface CreateDailySnapshotButtonProps {
  storeId?: number
  onSnapshotCreated?: () => void
}

export default function CreateDailySnapshotButton({ onSnapshotCreated }: CreateDailySnapshotButtonProps) {
  const [loading, setLoading] = useState(false)
  const [autoSnapshotEnabled, setAutoSnapshotEnabled] = useState(false)
  const [snapshotTime, setSnapshotTime] = useState('23:59')
  const [showSettings, setShowSettings] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const createSnapshotForAllStores = useCallback(async () => {
    try {
      // Get all active stores
      const response = await fetch('/api/stores')
      if (response.ok) {
        const stores = await response.json()
        const activeStores = stores.filter((store: { status: string }) => store.status === 'active')
        
        // Create snapshots for all active stores
        for (const store of activeStores) {
          await fetch('/api/cash-history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              store_id: store.id,
              date: new Date().toISOString().split('T')[0]
            }),
          })
        }
        
        console.log(`Snapshot created for ${activeStores.length} stores at ${new Date().toLocaleString()}`)
        onSnapshotCreated?.()
      }
    } catch (error) {
      console.error('Error creating snapshot:', error)
    }
  }, [onSnapshotCreated])

  const setupAutoSnapshot = useCallback(() => {
    // Clear any existing interval
    const existingInterval = window.autoSnapshotInterval
    if (existingInterval) {
      clearInterval(existingInterval)
    }

    // Calculate time until next snapshot
    const [hours, minutes] = snapshotTime.split(':').map(Number)
    const now = new Date()
    const nextSnapshot = new Date()
    nextSnapshot.setHours(hours, minutes, 0, 0)
    
    // If time has passed today, schedule for tomorrow
    if (nextSnapshot <= now) {
      nextSnapshot.setDate(nextSnapshot.getDate() + 1)
    }

    const timeUntilSnapshot = nextSnapshot.getTime() - now.getTime()

    // Schedule the snapshot
    setTimeout(() => {
      createSnapshotForAllStores()
      // Set up recurring daily snapshots
      window.autoSnapshotInterval = setInterval(createSnapshotForAllStores, 24 * 60 * 60 * 1000)
    }, timeUntilSnapshot)
  }, [snapshotTime, createSnapshotForAllStores])

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('autoSnapshotSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setAutoSnapshotEnabled(settings.enabled || false)
      setSnapshotTime(settings.time || '23:59')
    }

    // Set up automatic snapshot if enabled
    if (autoSnapshotEnabled) {
      setupAutoSnapshot()
    }

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timeInterval)
  }, [autoSnapshotEnabled, setupAutoSnapshot])





  const handleCreateSnapshot = async () => {
    setLoading(true)
    
    try {
      // Use the same function as auto snapshot to create for all stores
      await createSnapshotForAllStores()
      alert('Snapshot created successfully for all stores!')
    } catch (error) {
      console.error('Error creating snapshot:', error)
      alert('Failed to create snapshot')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoSnapshotToggle = () => {
    const newEnabled = !autoSnapshotEnabled
    setAutoSnapshotEnabled(newEnabled)
    
    // Save settings to localStorage
    const settings = {
      enabled: newEnabled,
      time: snapshotTime
    }
    localStorage.setItem('autoSnapshotSettings', JSON.stringify(settings))
    
    if (newEnabled) {
      alert(`Auto snapshot enabled! Snapshots will be created daily at ${snapshotTime}`)
    } else {
      // Clear interval if disabled
      if (window.autoSnapshotInterval) {
        clearInterval(window.autoSnapshotInterval)
        window.autoSnapshotInterval = null
      }
      alert('Auto snapshot disabled')
    }
  }

  return (
    <div className="space-y-3">
      {/* Auto Snapshot Settings */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-green-50 rounded-lg gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-900">Auto Daily Snapshot</span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <input
            type="time"
            value={snapshotTime}
            onChange={(e) => {
              setSnapshotTime(e.target.value)
              const settings = { enabled: autoSnapshotEnabled, time: e.target.value }
              localStorage.setItem('autoSnapshotSettings', JSON.stringify(settings))
            }}
            className="px-2 py-1 border border-green-300 rounded text-sm"
          />
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-green-600 hover:text-green-800"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleAutoSnapshotToggle}
            className={`px-3 py-1 rounded text-sm font-medium ${
              autoSnapshotEnabled 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {autoSnapshotEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

             {/* Manual Snapshot */}
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-blue-50 rounded-lg gap-3">
         <div className="flex items-center gap-2">
           <Calendar className="w-4 h-4 text-blue-600" />
           <div>
             <span className="text-sm font-medium text-blue-900">Manual Snapshot</span>
             <div className="text-xs text-blue-700">
               Current time: {currentTime.toLocaleTimeString()}
             </div>
           </div>
         </div>
         
         <button
           onClick={handleCreateSnapshot}
           disabled={loading}
           className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
         >
           <Save className="w-4 h-4" />
           {loading ? 'Creating...' : 'Snap Now'}
         </button>
       </div>

             {/* Settings Info */}
       {showSettings && (
         <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
           <p><strong>Auto Snapshot:</strong> Creates daily snapshots automatically at the specified time for all active stores.</p>
           <p><strong>Manual Snapshot:</strong> Create snapshots immediately for all active stores. Multiple snapshots per day are allowed.</p>
           <p><strong>Note:</strong> Auto snapshots run in the browser and require the page to be open.</p>
         </div>
       )}
    </div>
  )
}

'use client'

import { useAuth } from '@/contexts/auth-context'
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import ParticipantDashboard from '@/components/dashboard/ParticipantDashboard'
import JudgeDashboard from '@/components/dashboard/JudgeDashboard'
import SponsorDashboard from '@/components/dashboard/SponsorDashboard'

export default function DashboardPage() {
  const { user } = useAuth()
  const role = user?.role

 
  if (role === 'admin') {
    return <AdminDashboard />
  }

  if (role === 'participant') {
    return <ParticipantDashboard />
  }

  if (role === 'judge') {
    return <JudgeDashboard />
  }

  if (role === 'sponsor') {
    return <SponsorDashboard />
  }

  // Fallback
  return (
    <div className="space-y-8">
      <div>
        <h1 className="h2 text-cs-heading">Dashboard</h1>
        <p className="p1 mt-1 text-cs-text">Loading...</p>
      </div>
    </div>
  )
}

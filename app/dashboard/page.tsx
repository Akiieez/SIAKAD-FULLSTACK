'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardRootPage() {
  const router = useRouter()

  useEffect(() => {
    async function redirectByUserRole() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      // Ambil role user dari tabel profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role || 'mahasiswa'

      // Redirect otomatis sesuai role
      if (role === 'admin') {
        router.replace('/dashboard/admin')
      } else if (role === 'dosen') {
        router.replace('/dashboard/dosen-profil')
      } else {
        router.replace('/dashboard/profil')
      }
    }

    redirectByUserRole()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600 font-medium">Mengarahkan ke halaman...</span>
    </div>
  )
}
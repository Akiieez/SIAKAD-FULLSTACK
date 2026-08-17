'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Sidebar() {
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserRole() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        setRole(profile?.role || 'mahasiswa')
      }
      setLoading(false)
    }

    fetchUserRole()
  }, [])

  if (loading) {
    return <aside className="w-64 bg-slate-900 text-white p-6">Memuat menu...</aside>
  }

  // Definisi Menu Per Role
  const menuAdmin = [
    { name: 'Dashboard Admin', href: '/dashboard/admin', icon: '📊' },
    { name: 'Data Mahasiswa', href: '/dashboard/mahasiswa', icon: '🎓' },
    { name: 'Data Dosen', href: '/dashboard/dosen', icon: '👨‍🏫' },
    { name: 'Mata Kuliah', href: '/dashboard/matakuliah', icon: '📚' },
  ]

  const menuMahasiswa = [
    { name: 'Profil Saya', href: '/dashboard/profil', icon: '👤' },
    { name: 'KRS Matakuliah', href: '/dashboard/krs', icon: '📝' },
  ]

  const menuDosen = [
    { name: 'Profil Dosen', href: '/dashboard/dosen-profil', icon: '👨‍🏫' },
    { name: 'Jadwal Mengajar', href: '/dashboard/jadwal', icon: '📅' },
  ]

  let menuItems = menuMahasiswa
  if (role === 'admin') menuItems = menuAdmin
  if (role === 'dosen') menuItems = menuDosen

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col justify-between">
      <div>
        <div className="mb-8 px-2">
          <h2 className="text-xl font-bold tracking-wide text-blue-400">SISTEM AKADEMIK</h2>
          <p className="text-xs text-slate-400 capitalize">Role: {role || 'Mahasiswa'}</p>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            window.location.href = '/login'
          }}
          className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span>🚪</span>
          <span>Keluar (Logout)</span>
        </button>
      </div>
    </aside>
  )
}
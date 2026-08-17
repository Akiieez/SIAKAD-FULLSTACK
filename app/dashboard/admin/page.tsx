import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardAdminPage() {
  const supabase = await createClient()

  // 1. Cek User Autentikasi
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Cek Role Admin dari Profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, nama')
    .eq('id', user.id)
    .maybeSingle()

  // Bolehkan jika role === 'admin' ATAU jika emailnya adalah admin@ungres.co.id
  const isAdmin = profile?.role === 'admin' || user.email === 'admin@ungres.co.id'

  // 3. Logic Penentuan Role yang Lebih Fleksibel
  let userRole = profile?.role

  // Jika di database role-nya belum terisi / null, cek dari format email
  if (!userRole) {
    const emailPrefix = user.email?.split('@')[0] || ''
    // Jika awalan email berupa angka (NIM), set sebagai mahasiswa
    if (/^\d+$/.test(emailPrefix)) {
      userRole = 'mahasiswa'
    } else {
      userRole = 'dosen'
    }
  }

  // Format Teks (misal: "mahasiswa" -> "Mahasiswa", "dosen" -> "Dosen")
  const displayRole = userRole.charAt(0).toUpperCase() + userRole.slice(1)

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto font-sans text-center space-y-4 py-20">
        <div className="text-5xl">🚫</div>
        <h1 className="text-2xl font-bold text-gray-800">Akses Ditolak</h1>
        <p className="text-gray-600 text-sm">
          Akun Anda ({user.email}) terdeteksi sebagai <strong className="font-semibold text-gray-900">{displayRole}</strong> dan tidak memiliki hak akses ke Halaman Administrator.
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <Link
            href="/dashboard/profil"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Ke Profil Saya
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
          >
            Ganti Akun
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            ⚙️ Dashboard Admin SIAKAD
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sistem Informasi Akademik — Panel Kendali Utama
          </p>
        </div>

        <Link
          href="/dashboard/profil"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-xs w-fit"
        >
          <span>👤</span>
          <span>Kelola Profil & Password</span>
        </Link>
      </div>

      {/* ADMIN INFO CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            Selamat Datang, {profile?.nama || 'Admin'}! 👋
          </h2>
          <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            System Admin
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 pt-2 border-t border-gray-100">
          <div>
            <span className="text-gray-500 block text-xs font-medium uppercase">Email Akun</span>
            <span className="font-semibold text-gray-900">{user.email}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs font-medium uppercase">Akses Hak Otorisasi</span>
            <span className="font-semibold text-gray-900">Administrator (Full Access)</span>
          </div>
        </div>
      </div>

      {/* QUICK STATS / MENU SHORTCUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link 
          href="/dashboard/mahasiswa" 
          className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs hover:border-blue-400 hover:shadow-md transition group"
        >
          <div className="text-2xl mb-2">🎓</div>
          <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition">Data Mahasiswa</h3>
          <p className="text-xs text-gray-500 mt-1">Kelola data, verifikasi, dan status akademik mahasiswa.</p>
        </Link>

        <Link 
          href="/dashboard/dosen" 
          className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs hover:border-blue-400 hover:shadow-md transition group"
        >
          <div className="text-2xl mb-2">👨‍🏫</div>
          <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition">Data Dosen</h3>
          <p className="text-xs text-gray-500 mt-1">Manajemen data pengajar dan alokasi dosen wali.</p>
        </Link>

        <Link 
          href="/dashboard/matakuliah" 
          className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs hover:border-blue-400 hover:shadow-md transition group"
        >
          <div className="text-2xl mb-2">📚</div>
          <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition">Mata Kuliah</h3>
          <p className="text-xs text-gray-500 mt-1">Pengaturan kurikulum, SKS, dan penawaran matkul.</p>
        </Link>
      </div>
    </div>
  )
}
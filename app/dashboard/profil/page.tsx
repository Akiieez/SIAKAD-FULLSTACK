'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProfilPage() {
  const [role, setRole] = useState<'admin' | 'dosen' | 'mahasiswa' | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // State Modal Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form State General & Password
  const [formData, setFormData] = useState<any>({})
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswordSection, setShowPasswordSection] = useState(false)

  const supabase = createClient()

  const loadProfile = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // 1. Cek Role dari tabel profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const currentRole = profile?.role || 'mahasiswa'
    setRole(currentRole as any)

    // 2. Load Data berdasarkan Role
    if (currentRole === 'admin') {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setUserData(data || { email: user.email, nama: 'Administrator' })
      setFormData({
        nama: data?.nama || data?.full_name || '',
        email: data?.email || user.email || '',
        no_hp: data?.no_hp || '',
        alamat: data?.alamat || '',
      })

    } else if (currentRole === 'dosen') {
      const queryDosen = `
        *,
        fakultas_rel:fakultas_id ( nama ),
        prodi_rel:program_studi_id ( nama )
      `
      let { data } = await supabase
        .from('dosen')
        .select(queryDosen)
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle()

      setUserData(data)
      if (data) {
        setFormData({
          email: data.email || user.email || '',
          no_hp: data.no_hp || '',
          bidang_keahlian: data.bidang_keahlian || '',
          jam_konsultasi: data.jam_konsultasi || '',
          alamat: data.alamat || '',
        })
      }

    } else {
      // Role Mahasiswa
      const queryMhs = `
        *,
        fakultas_rel:fakultas_id ( nama ),
        prodi_rel:program_studi_id ( nama ),
        dosen_wali:dosen_wali_id ( nama_lengkap, gelar )
      `
      let { data } = await supabase
        .from('mahasiswa')
        .select(queryMhs)
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle()

      setUserData(data)
      if (data) {
        setFormData({
          email: data.email || user.email || '',
          no_hp: data.no_hp || '',
          nik: data.nik || '',
          tempat_lahir: data.tempat_lahir || '',
          tanggal_lahir: data.tanggal_lahir || '',
          jenis_kelamin: data.jenis_kelamin || 'L',
          agama: data.agama || 'Islam',
          alamat: data.alamat || '',
        })
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    loadProfile()
  }, [])

  // Helper Relasi
  const getFakultas = (item: any) => item?.fakultas_rel?.nama || item?.fakultas || '-'
  const getProdi = (item: any) => item?.prodi_rel?.nama || item?.program_studi || '-'
  const getDosenWali = (item: any) => {
    if (!item?.dosen_wali) return '-'
    const dw = item.dosen_wali
    return `${dw.nama_lengkap}${dw.gelar ? `, ${dw.gelar}` : ''}`
  }

  // Handler Simpan Profil & Ganti Password
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation Ganti Password jika dicentang/dibuka
    if (showPasswordSection) {
      if (!newPassword) {
        alert('Password baru tidak boleh kosong!')
        return
      }
      if (newPassword.length < 6) {
        alert('Password baru minimal 6 karakter!')
        return
      }
      if (newPassword !== confirmPassword) {
        alert('Konfirmasi password baru tidak cocok!')
        return
      }
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Update Password di Supabase Auth (Jika Diisi)
      if (showPasswordSection && newPassword) {
        const { error: passError } = await supabase.auth.updateUser({
          password: newPassword
        })
        if (passError) throw passError
      }

      // 2. Update Data Biodata sesuai Role
      if (role === 'admin') {
        const { error } = await supabase
          .from('profiles')
          .update({
            nama: formData.nama,
            no_hp: formData.no_hp,
            alamat: formData.alamat,
          })
          .eq('id', user?.id)

        if (error) throw error

      } else if (role === 'dosen') {
        if (!userData?.id) return
        const { error } = await supabase
          .from('dosen')
          .update({
            email: formData.email,
            no_hp: formData.no_hp,
            bidang_keahlian: formData.bidang_keahlian,
            jam_konsultasi: formData.jam_konsultasi,
            alamat: formData.alamat,
          })
          .eq('id', userData.id)

        if (error) throw error

      } else if (role === 'mahasiswa') {
        if (!userData?.id) return
        const { error } = await supabase
          .from('mahasiswa')
          .update({
            email: formData.email,
            no_hp: formData.no_hp,
            nik: formData.nik,
            tempat_lahir: formData.tempat_lahir,
            tanggal_lahir: formData.tanggal_lahir || null,
            jenis_kelamin: formData.jenis_kelamin,
            agama: formData.agama,
            alamat: formData.alamat,
          })
          .eq('id', userData.id)

        if (error) throw error
      }

      alert('Profil ' + (showPasswordSection ? '& Password ' : '') + 'berhasil diperbarui!')
      
      // Reset State Form Modal
      setIsEditModalOpen(false)
      setShowPasswordSection(false)
      setNewPassword('')
      setConfirmPassword('')

      loadProfile()
    } catch (err: any) {
      alert('Gagal menyimpan perubahan: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 font-sans text-gray-500">Memuat data profil...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      {/* HEADER PAGE */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          {role === 'admin' && '🛡️ Profil Administrator'}
          {role === 'dosen' && '👨‍🏫 Profil Dosen'}
          {role === 'mahasiswa' && '🎓 Profil Mahasiswa'}
        </h1>
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <span>✏️</span>
          <span>Edit Profil & Password</span>
        </button>
      </div>

      {/* ==================== VIEW ROLE ADMIN ==================== */}
      {role === 'admin' && (
        <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm space-y-3 text-gray-800">
          <p className="text-base">
            <strong className="w-36 inline-block text-gray-700">Nama Pengelola:</strong> {userData?.nama || userData?.full_name || 'Administrator'}
          </p>
          <p className="text-base">
            <strong className="w-36 inline-block text-gray-700">Role Akses:</strong> 
            <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase">
              System Admin
            </span>
          </p>
          <p className="text-base">
            <strong className="w-36 inline-block text-gray-700">Email Utama:</strong> {userData?.email || '-'}
          </p>
          <p className="text-base">
            <strong className="w-36 inline-block text-gray-700">No. HP / WA:</strong> {userData?.no_hp || '-'}
          </p>
          <p className="text-base">
            <strong className="w-36 inline-block text-gray-700">Alamat Kantor:</strong> {userData?.alamat || '-'}
          </p>
        </div>
      )}

      {/* ==================== VIEW ROLE DOSEN ==================== */}
      {role === 'dosen' && (
        userData ? (
          <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm space-y-3 text-gray-800">
            <p className="text-base">
              <strong className="w-36 inline-block text-gray-700">Nama Dosen:</strong> {userData.nama_lengkap || '-'} {userData.gelar ? `, ${userData.gelar}` : ''}
            </p>
            <p className="text-base">
              <strong className="w-36 inline-block text-gray-700">NIDN / NIP:</strong> {userData.nidn || userData.nip || '-'}
            </p>
            <p className="text-base">
              <strong className="w-36 inline-block text-gray-700">Fakultas:</strong> {getFakultas(userData)}
            </p>
            <p className="text-base">
              <strong className="w-36 inline-block text-gray-700">Program Studi:</strong> {getProdi(userData)}
            </p>
            <p className="text-base">
              <strong className="w-36 inline-block text-gray-700">Keahlian:</strong> {userData.bidang_keahlian || '-'}
            </p>
            <p className="text-base">
              <strong className="w-36 inline-block text-gray-700">Jam Bimbingan:</strong> {userData.jam_konsultasi || '-'}
            </p>
            <p className="text-base">
              <strong className="w-36 inline-block text-gray-700">No. HP / WA:</strong> {userData.no_hp || '-'}
            </p>
            <p className="text-base">
              <strong className="w-36 inline-block text-gray-700">Email:</strong> {userData.email || '-'}
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200">
            Data dosen belum terhubung dengan akun login ini.
          </div>
        )
      )}

      {/* ==================== VIEW ROLE MAHASISWA ==================== */}
      {role === 'mahasiswa' && (
        userData ? (
          <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm space-y-3 text-gray-800">
            <p className="text-base">
              <strong className="w-36 inline-block text-gray-700">Nama:</strong> {userData.nama_lengkap || '-'}
            </p>
            <p className="text-base">
              <strong className="w-36 inline-block text-gray-700">NIM:</strong> {userData.nim || '-'}
            </p>
            <p className="text-base">
              <strong className="w-36 inline-block text-gray-700">Fakultas:</strong> {getFakultas(userData)}
            </p>
            <p className="text-base">
              <strong className="w-36 inline-block text-gray-700">Program Studi:</strong> {getProdi(userData)}
            </p>
            {userData.dosen_wali && (
              <p className="text-base">
                <strong className="w-36 inline-block text-gray-700">Dosen Wali:</strong> {getDosenWali(userData)}
              </p>
            )}
            {userData.no_hp && (
              <p className="text-base">
                <strong className="w-36 inline-block text-gray-700">No. HP / WA:</strong> {userData.no_hp}
              </p>
            )}
            <p className="text-base">
              <strong className="w-36 inline-block text-gray-700">Email:</strong> {userData.email || '-'}
            </p>
            {userData.alamat && (
              <p className="text-base">
                <strong className="w-36 inline-block text-gray-700">Alamat:</strong> {userData.alamat}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200">
            Data mahasiswa belum terhubung dengan akun login ini.
          </div>
        )
      )}

      {/* ==================== MODAL POP-UP EDIT ==================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-800">
                ✏️ Edit Profil ({role?.toUpperCase()})
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* EDIT BIODATA ROLE ADMIN */}
              {role === 'admin' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Nama Lengkap</label>
                    <input
                      type="text"
                      value={formData.nama || ''}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">No. Telepon / WA</label>
                    <input
                      type="text"
                      value={formData.no_hp || ''}
                      onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                      className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Alamat Kantor / Domisili</label>
                    <textarea
                      rows={3}
                      value={formData.alamat || ''}
                      onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                      className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>
              )}

              {/* EDIT BIODATA ROLE DOSEN */}
              {role === 'dosen' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Email Kontak</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">No. HP / WhatsApp</label>
                      <input
                        type="text"
                        value={formData.no_hp || ''}
                        onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Bidang Keahlian / Riset</label>
                    <input
                      type="text"
                      placeholder="Contoh: Rekayasa Perangkat Lunak, Data Science"
                      value={formData.bidang_keahlian || ''}
                      onChange={(e) => setFormData({ ...formData, bidang_keahlian: e.target.value })}
                      className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Jadwal Jam Konsultasi / Bimbingan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Senin & Rabu (13:00 - 15:00 WIB)"
                      value={formData.jam_konsultasi || ''}
                      onChange={(e) => setFormData({ ...formData, jam_konsultasi: e.target.value })}
                      className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Alamat Domisili</label>
                    <textarea
                      rows={2}
                      value={formData.alamat || ''}
                      onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                      className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>
              )}

              {/* EDIT BIODATA ROLE MAHASISWA */}
              {role === 'mahasiswa' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Email Utama</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">No. HP / WhatsApp</label>
                      <input
                        type="text"
                        value={formData.no_hp || ''}
                        onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">NIK / No. KTP</label>
                      <input
                        type="text"
                        value={formData.nik || ''}
                        onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Jenis Kelamin</label>
                      <select
                        value={formData.jenis_kelamin || 'L'}
                        onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                      >
                        <option value="L">Laki-Laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Tempat Lahir</label>
                      <input
                        type="text"
                        value={formData.tempat_lahir || ''}
                        onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Tanggal Lahir</label>
                      <input
                        type="date"
                        value={formData.tanggal_lahir || ''}
                        onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Alamat Domisili Lengkap</label>
                    <textarea
                      rows={2}
                      value={formData.alamat || ''}
                      onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                      className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>
              )}

              {/* FITUR GANTI PASSWORD (SAMA UNTUK SEMUA ROLE) */}
              <div className="border-t pt-4 mt-4">
                <label className="flex items-center gap-2 cursor-pointer mb-3 select-none">
                  <input
                    type="checkbox"
                    checked={showPasswordSection}
                    onChange={(e) => setShowPasswordSection(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-bold text-gray-800">🔑 Ubah Password Akun</span>
                </label>

                {showPasswordSection && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 transition-all">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Password Baru</label>
                      <input
                        type="password"
                        placeholder="Minimal 6 karakter"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Konfirmasi Password Baru</label>
                      <input
                        type="password"
                        placeholder="Ketik ulang password baru"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
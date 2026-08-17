'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Fakultas = {
  id: string
  nama: string
}

export default function TambahDosenPage() {
  const [nidn, setNidn] = useState('')
  const [namaLengkap, setNamaLengkap] = useState('')
  const [gelar, setGelar] = useState('')
  const [email, setEmail] = useState('')
  const [fakultasId, setFakultasId] = useState('')

  const [listFakultas, setListFakultas] = useState<Fakultas[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingFakultas, setFetchingFakultas] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function getFakultas() {
      const { data } = await supabase.from('fakultas').select('id, nama').order('nama')
      if (data && data.length > 0) {
        setListFakultas(data)
        setFakultasId(data[0].id)
      }
      setFetchingFakultas(false)
    }
    getFakultas()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.from('dosen').insert([
      {
        nidn,
        nama_lengkap: namaLengkap,
        gelar,
        email,
        fakultas_id: fakultasId,
      },
    ])

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard/dosen')
      router.refresh()
    }
  }

  if (fetchingFakultas) {
    return (
      <div className="p-8 max-w-2xl mx-auto font-sans text-center text-gray-500">
        Memuat data Fakultas...
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto font-sans">
      <div className="mb-6">
        <Link href="/dashboard/dosen" className="text-sm text-blue-600 hover:underline">
          ← Kembali ke Data Dosen
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Tambah Dosen Baru</h1>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIDN (Nomor Induk Dosen Nasional)</label>
            <input
              type="text"
              required
              placeholder="Contoh: 0715088501"
              value={nidn}
              onChange={(e) => setNidn(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gelar (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: S.T., M.T."
                value={gelar}
                onChange={(e) => setGelar(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fakultas</label>
              <select
                value={fakultasId}
                onChange={(e) => setFakultasId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
              >
                {listFakultas.map((f) => (
                  <option key={f.id} value={f.id}>{f.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (Opsional)</label>
              <input
                type="email"
                placeholder="dosen@ungres.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Menyimpan...' : 'Simpan Data Dosen'}
          </button>
        </form>
      </div>
    </div>
  )
}
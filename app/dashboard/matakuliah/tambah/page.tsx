'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ProgramStudi = { id: string; nama: string; kode: string }

export default function TambahMataKuliahPage() {
  const [kodeMk, setKodeMk] = useState('')
  const [namaMk, setNamaMk] = useState('')
  const [sks, setSks] = useState('3')
  const [semester, setSemester] = useState('1')
  const [prodiId, setProdiId] = useState('')

  const [listProdi, setListProdi] = useState<ProgramStudi[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadProdi() {
      const { data } = await supabase.from('program_studi').select('id, nama, kode').order('nama')
      if (data) {
        setListProdi(data)
        if (data.length > 0) setProdiId(data[0].id)
      }
      setFetchingData(false)
    }
    loadProdi()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.from('mata_kuliah').insert([
      {
        kode_mk: kodeMk.toUpperCase(),
        nama_mk: namaMk,
        sks: parseInt(sks),
        semester: parseInt(semester),
        program_studi_id: prodiId,
      },
    ])

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard/matakuliah')
      router.refresh()
    }
  }

  if (fetchingData) {
    return <div className="p-8 text-center text-gray-500">Memuat data form...</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto font-sans">
      <div className="mb-6">
        <Link href="/dashboard/matakuliah" className="text-sm text-blue-600 hover:underline">
          ← Kembali ke Data Mata Kuliah
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Tambah Mata Kuliah Baru</h1>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode MK</label>
              <input
                type="text"
                required
                placeholder="Contoh: TIF006"
                value={kodeMk}
                onChange={(e) => setKodeMk(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Studi</label>
              <select
                value={prodiId}
                onChange={(e) => setProdiId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
              >
                {listProdi.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Mata Kuliah</label>
            <input
              type="text"
              required
              placeholder="Contoh: Pemrograman Mobile"
              value={namaMk}
              onChange={(e) => setNamaMk(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah SKS</label>
              <select
                value={sks}
                onChange={(e) => setSks(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
              >
                {[1, 2, 3, 4, 6].map((num) => (
                  <option key={num} value={num}>{num} SKS</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? 'Menyimpan...' : 'Simpan Mata Kuliah'}
          </button>
        </form>
      </div>
    </div>
  )
}
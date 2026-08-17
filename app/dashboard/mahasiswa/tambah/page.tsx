'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Fakultas = { id: string; nama: string; kode: string }
type ProgramStudi = { id: string; nama: string; kode: string; fakultas_id: string }
type Dosen = { 
  id: string
  nama_lengkap: string
  gelar?: string
  fakultas_id?: string
  program_studi_id?: string
}

export default function TambahMahasiswaPage() {
  const [namaLengkap, setNamaLengkap] = useState('')
  const [angkatan, setAngkatan] = useState('2026')
  const [fakultasId, setFakultasId] = useState('')
  const [prodiId, setProdiId] = useState('')
  const [dosenWaliId, setDosenWaliId] = useState('')

  const [listFakultas, setListFakultas] = useState<Fakultas[]>([])
  const [listProdi, setListProdi] = useState<ProgramStudi[]>([])
  const [listDosen, setListDosen] = useState<Dosen[]>([])

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [generatedNim, setGeneratedNim] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const supabase = createClient()
  const router = useRouter()

  // 1. Fetch Master Data
  useEffect(() => {
    async function loadMasterData() {
      const [{ data: fakData }, { data: prdData }, { data: dsnData }] = await Promise.all([
        supabase.from('fakultas').select('*').order('nama'),
        supabase.from('program_studi').select('*').order('nama'),
        supabase.from('dosen').select('id, nama_lengkap, gelar, fakultas_id, program_studi_id').order('nama_lengkap')
      ])

      if (fakData) setListFakultas(fakData)
      if (prdData) setListProdi(prdData)
      if (dsnData) setListDosen(dsnData)

      if (fakData && fakData.length > 0) setFakultasId(fakData[0].id)
      setFetchingData(false)
    }
    loadMasterData()
  }, [])

  // Filter prodi berdasarkan fakultas_id
  const filteredProdi = listProdi.filter((p) => p.fakultas_id === fakultasId)

  useEffect(() => {
    if (filteredProdi.length > 0) {
      setProdiId(filteredProdi[0].id)
    } else {
      setProdiId('')
    }
  }, [fakultasId])

// Filter Dosen Wali langsung via program_studi_id & fakultas_id
  const filteredDosen = listDosen.filter((d) => {
    // Abaikan jika dosen tidak punya relasi fakultas di DB
    if (!d.fakultas_id) return false

    // Jika prodiId dipilih DAN dosen punya program_studi_id, cocokkan ID prodi
    if (prodiId && d.program_studi_id) {
      return d.program_studi_id === prodiId
    }

    // Jika tidak, cocokkan berdasarkan ID fakultasnya saja
    return d.fakultas_id === fakultasId
  })

  // Reset Pilihan Dosen Wali jika prodi berubah
  useEffect(() => {
    setDosenWaliId('')
  }, [fakultasId, prodiId])

  // Generate NIM Otomatis
  useEffect(() => {
    async function generateNim() {
      if (!fakultasId || !prodiId) return

      const fak = listFakultas.find((f) => f.id === fakultasId)
      const prd = listProdi.find((p) => p.id === prodiId)

      if (!fak || !prd) return

      const fakKode = fak.kode ? String(fak.kode).padStart(2, '0') : '01'
      const prdKode = prd.kode ? String(prd.kode).padStart(2, '0') : '01'
      const thnKode = angkatan.slice(-2)

      const { count } = await supabase
        .from('mahasiswa')
        .select('*', { count: 'exact', head: true })
        .eq('program_studi_id', prodiId)
        .eq('angkatan', parseInt(angkatan))

      const urutan = String((count || 0) + 1).padStart(3, '0')
      setGeneratedNim(`${fakKode}${prdKode}${thnKode}${urutan}`)
    }

    generateNim()
  }, [fakultasId, prodiId, angkatan, listFakultas, listProdi])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    // Simpan Foreign Key ID (bukan teks string lagi)
    const { error } = await supabase.from('mahasiswa').insert([
      {
        nim: generatedNim,
        nama_lengkap: namaLengkap,
        fakultas_id: fakultasId,
        program_studi_id: prodiId,
        angkatan: parseInt(angkatan),
        dosen_wali_id: dosenWaliId || null,
      },
    ])

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard/mahasiswa')
      router.refresh()
    }
  }

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 text-sm">Memuat form data...</span>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto font-sans">
      <div className="mb-6">
        <Link
          href="/dashboard/mahasiswa"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium mb-2"
        >
          ← Kembali ke Data Mahasiswa
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Tambah Mahasiswa Baru</h1>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 text-sm rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              placeholder="Contoh: Ahmad Subagja"
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Studi</label>
              <select
                value={prodiId}
                onChange={(e) => setProdiId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
              >
                {filteredProdi.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Angkatan</label>
              <input
                type="number"
                required
                value={angkatan}
                onChange={(e) => setAngkatan(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilih Dosen Wali (Opsional)
              </label>
              <select
                value={dosenWaliId}
                onChange={(e) => setDosenWaliId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
              >
                <option value="">-- Tanpa Dosen Wali --</option>
                {filteredDosen.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama_lengkap}{d.gelar ? `, ${d.gelar}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIM (Otomatis)</label>
            <input
              type="text"
              disabled
              value={generatedNim}
              className="w-full px-4 py-2 border bg-gray-100 font-mono text-gray-700 font-bold rounded-lg outline-none cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? 'Menyimpan Data...' : 'Simpan Data Mahasiswa'}
          </button>
        </form>
      </div>
    </div>
  )
}
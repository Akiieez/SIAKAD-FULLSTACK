import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  
  // Tes panggil Supabase
  const { data, error } = await supabase.from('profiles').select('*')

  return (
    <main className="p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">SIAKAD UNGRES - Connection Test</h1>
      
      {error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          <p>Status: ❌ Gagal terhubung ke Supabase</p>
          <p className="text-sm font-mono mt-2">{error.message}</p>
        </div>
      ) : (
        <div className="p-4 bg-green-100 text-green-700 rounded">
          <p>Status: ✅ Berhasil terhubung ke Supabase!</p>
          <p className="text-sm mt-2">Jumlah data di tabel profiles: {data?.length ?? 0}</p>
        </div>
      )}
    </main>
  )
}
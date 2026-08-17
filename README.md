# 🎓 SIAKAD FULLSTACK - Sistem Informasi Akademik

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql)

Aplikasi **Sistem Informasi Akademik (SIAKAD)** berbasis web modern fullstack yang dirancang untuk mengelola ekosistem akademik kampus. Sistem ini mendukung **Role-Based Access Control (RBAC)** untuk 3 entitas pengguna utama: **Mahasiswa**, **Dosen**, dan **Administrator**.

---

## 🚀 Fitur Utama

- 🔐 **Authentication & Role Authorization**:
  - Login aman menggunakan Supabase Auth (SSR Client).
  - Otorisasi halaman berbasis role (**Mahasiswa**, **Dosen**, **Admin**) dengan proteksi akses ilegal & penanganan error halaman terlarang (*Akses Ditolak*).
  - Penanganan state session yang *clean*, *anti-back button cache*, & *real-time redirect*.
  
- 🎓 **Panel Mahasiswa**:
  - Manajemen profil & kata sandi akun.
  - Modul Kartu Rencana Studi (KRS) & pengisian KRS Mata Kuliah.

- 👨‍🏫 **Panel Dosen**:
  - Manajemen data pengajar, mata kuliah diampu, & alokasi bimbingan akademik.

- ⚙️ **Panel Administrator**:
  - Central dashboard untuk manajemen data master (Mahasiswa, Dosen, Mata Kuliah).
  - Otorisasi penuh sistem (*Full Access*).

---

## 🛠️ Tech Stack & Arsitektur

| Kategori | Teknologi / Library | Deskripsi |
|---|---|---|
| **Framework** | **Next.js 15** (App Router) | React Framework untuk Server-Side Rendering (SSR) & Server Components |
| **Language** | **TypeScript** | Type-safe JavaScript untuk keandalan skrip & pengembangan efisien |
| **Styling** | **Tailwind CSS** | Utility-first CSS framework untuk UI responsif & modern |
| **Backend & Auth** | **Supabase** | Backend-as-a-Service (BaaS) untuk PostgreSQL Database & Authentication |
| **Database** | **PostgreSQL** | Relational Database Management System (RDBMS) |
| **Icons & Design** | **Lucide Icons / Emoji UI** | Elemen visual bersih dan intuitif |

---

## 🗄️ Panduan Setup & Import Database Supabase

Untuk menjalankan project ini beserta database-nya, Anda perlu mengonfigurasi skema database di Supabase.

### 1. Buat Project Baru di Supabase
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat project baru.
2. Catat **Project URL** dan **Anon API Key** dari menu **Project Settings > API**.

### 2. Import Skema & Struktur Tabel (SQL Editor)
1. Buka menu **SQL Editor** pada dashboard Supabase Anda.
2. Buat skrip SQL untuk membuat tabel-tabel utama (seperti `profiles`, `mahasiswa`, `dosen`, `matakuliah`, `krs`). Contoh skrip SQL sederhana:

```sql
-- 1. Buat Tabel Profiles (Terkoneksi dengan Supabase Auth Users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'dosen', 'mahasiswa')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policy Akses
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
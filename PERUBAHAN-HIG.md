# Perubahan Berdasarkan Apple Design System (HIG)

Dokumen ini menjelaskan apa yang diubah di DompetKu setelah aplikasi diperiksa memakai panduan **Apple Human Interface Guidelines** (HIG). Bahasa dibuat sederhana supaya mudah dibaca tanpa perlu latar belakang desain.

Tanggal: 25 Oktober 2026

---

## 1. Singkatnya

Aplikasi diperiksa halaman per halaman, lalu ditemukan 15 hal yang bisa diperbaiki. Semuanya sudah dikerjakan. Tidak ada perubahan pada cara kerja keuangan, data, atau login. Semua perubahan hanya menyentuh tampilan, keterbacaan, dan aksesibilitas.

Tiga masalah terbesar yang diperbaiki:

1. Semua tab browser memakai judul yang sama, jadi sulit dibedakan.
2. Gambar contoh di halaman depan ikut dibacakan oleh pembaca layar, termasuk angka saldo palsu.
3. Di halaman Transaksi, setiap baris dianggap "judul", sehingga struktur halaman jadi kacau.

---

## 2. Apa itu HIG dan kenapa dipakai

HIG adalah buku panduan desain dari Apple. Isinya aturan praktis soal tata letak, keterbacaan, ukuran tombol, dan cara aplikasi bersikap terhadap pengguna, termasuk pengguna pembaca layar.

Panduan ini dipakai karena banyak aturannya berlaku umum, bukan hanya untuk iPhone:

- Setiap halaman punya satu judul utama yang jelas.
- Tombol penting harus mudah dijangkau, terutama di layar kecil.
- Informasi tidak boleh disampaikan hanya lewat warna.
- Teks yang hanya hiasan tidak boleh dibacakan ke pembaca layar.
- Target sentuh harus cukup besar untuk jari.

---

## 3. Perubahan per bagian

### 3.1 Judul halaman

**Sebelum:** semua halaman memakai judul tab yang sama, "DompetKu: Catatan keuangan pribadi". Kalau membuka lima tab, semuanya tampak identik.

**Sesudah:** setiap halaman punya judul sendiri.

| Halaman | Judul tab |
|---|---|
| Ringkasan | Ringkasan · DompetKu |
| Transaksi | Transaksi · DompetKu |
| Rencana | Rencana · DompetKu |
| Laporan | Laporan · DompetKu |
| Pengaturan | Pengaturan · DompetKu |

Manfaatnya: tab, riwayat browser, dan daftar tab di pembaca layar jadi bisa dibedakan.

### 3.2 Dialog (jendela form)

**Sebelum:** di layar pendek, tombol "Simpan transaksi" dan "Batal" berada di bawah lipatan. Pengguna harus menggulir dulu untuk menyimpan. Judul dialog juga ikut hilang saat digulir.

**Sesudah:** judul menempel di atas dan tombol aksi menempel di bawah. Hanya isi form yang bergulir.

Hasil pengukuran di layar 390×700:

- Tombol "Simpan transaksi" terlihat tanpa perlu menggulir.
- Tombol "Batal" juga terlihat.
- Tidak ada celah kosong di bawah tombol.
- Jarak antara judul dan isi form tetap 20 piksel.

Dialog juga sekarang ditandai sebagai jendela modal, jadi pembaca layar tidak "membaca" halaman di belakangnya.

### 3.3 Grafik

**Sebelum:** pemasukan dan pengeluaran dibedakan hanya dari warna hijau dan merah. Pengguna yang buta warna tidak bisa membedakannya. Grafik tren kekayaan juga menyembunyikan angka di sumbu tegak, jadi tidak ada nilai yang bisa dibaca tanpa menyentuh grafik.

**Sesudah:**

- Di Ringkasan, garis pengeluaran dibuat putus-putus, sedangkan pemasukan tetap garis penuh.
- Di Laporan, batang pengeluaran dibuat berongga (garis tepi tebal, isi tipis), sedangkan pemasukan tetap penuh.
- Keterangan (legenda) ikut menyesuaikan bentuknya.
- Sumbu tegak grafik tren kekayaan sekarang menampilkan angka, misalnya 810 rb sampai 1 jt.

Manfaatnya: informasi tetap terbaca meski warna tidak terlihat, dan nilai grafik bisa dibaca sekilas tanpa menyentuh layar.

### 3.4 Daftar transaksi

**Sebelum:** setiap baris transaksi memakai penanda "judul" (H2). Akibatnya daftar judul halaman Transaksi berisi "Air, Makanan, Bensin, Wifi", bukan bagian-bagian halaman. Nama kategori juga muncul dua kali: sebagai judul baris dan sebagai label kecil di sebelahnya.

**Sesudah:**

- Baris transaksi bukan lagi "judul", hanya teks biasa. Struktur halaman kembali rapi.
- Label kategori hanya muncul kalau berbeda dari nama transaksi. Kalau transaksi bernama "Air" dan kategorinya juga "Air", label itu disembunyikan.
- Label kategori disederhanakan menjadi satu titik warna dan nama. Ikon kecil abu-abu di dalamnya dibuang karena hanya menambah keramaian.

Contoh hasil akhir: **Air** · Dompet Harian · 24 Okt 2026 · −Rp50.000

### 3.5 Halaman publik (beranda dan tutorial)

**Beranda:** gambar contoh aplikasi di bagian atas (yang menampilkan saldo Rp12.850.000) sekarang disembunyikan dari pembaca layar. Sebelumnya angka palsu itu ikut dibacakan seolah-olah data pengguna.

**Tutorial:** pratinjau ponsel di sisi kanan menduplikasi teks langkah yang sama, sehingga isi halaman terbaca dua kali. Pratinjau itu sekarang disembunyikan di layar kecil dan diabaikan pembaca layar.

**Footer:** tautan "Tutorial & FAQ" dan "Buka aplikasi" sebelumnya hanya setinggi 20 piksel, terlalu kecil untuk jari. Sekarang area sentuhnya 44 piksel tanpa mengubah tampilan.

### 3.6 Masuk dan daftar

**Sebelum:** saat gagal masuk, muncul pesan "Email atau password salah." Tetapi kolom email dan password tidak ditandai bermasalah, dan kursor tetap di tombol. Pengguna pembaca layar tidak tahu kolom mana yang harus diperbaiki.

**Sesudah:**

- Kedua kolom ditandai tidak valid.
- Pesan error terhubung langsung ke kolom tersebut.
- Kursor otomatis pindah ke kolom email.

### 3.7 Rencana

**Sebelum:** kotak pencarian terpotong di layar ponsel ("…atau langsa"), dan empat tab (Anggaran, Tabungan, Hutang & piutang, Rutin) pecah menjadi dua baris sehingga tab yang aktif sulit terlihat.

**Sesudah:** teks pencarian dipersingkat menjadi "Cari anggaran, target, atau kontak…" dan keempat tab berada dalam satu baris.

### 3.8 Pengaturan

Kartu "Zona berbahaya" sebelumnya memakai ikon roda gigi, yang tidak memberi kesan bahaya. Sekarang memakai ikon peringatan.

### 3.9 Ringkasan dan Laporan

Kartu "Dibanding siklus lalu" sebelumnya menampilkan dua kotak yang keduanya berbunyi "Belum ada pembanding". Sekarang masing-masing menyebut apa yang kosong, misalnya "Belum ada pemasukan di siklus lalu".

### 3.10 Kartu dompet

Tumpukan kartu dompet menampilkan bagian atas kartu di belakangnya setinggi 30 piksel. Itu kurang untuk memuat judul kartu, sehingga judul tampak terpotong. Tingginya dinaikkan menjadi 40 piksel agar judul terbaca utuh.

---

## 4. Yang sengaja tidak diubah

Beberapa saran dari panduan Apple sengaja tidak dipakai karena tidak cocok dengan DompetKu:

- **Efek kaca (Liquid Glass).** Gaya visual aplikasi sudah rata dan ungu muda. Menambahkan efek kaca akan merusak keseragaman.
- **Tab bar ala iOS.** Navigasi bawah berupa ikon sudah memenuhi pola dan ukuran yang disarankan.
- **SF Symbols.** Ikon sudah konsisten memakai Hugeicons.
- **Memperbesar semua tombol di desktop.** Mouse tidak butuh target 44 piksel. Yang dinaikkan hanya di perangkat sentuh.
- **Pencarian di dalam daftar kategori.** Jumlah kategori masih sedikit, belum perlu.

---

## 5. Hasil pengujian

| Pemeriksaan | Hasil |
|---|---|
| Pemeriksaan kode dan format | Lulus |
| Pemeriksaan tipe TypeScript | Lulus |
| Unit test | 18 lulus, 0 gagal |
| Build produksi | Lulus |
| Uji tampilan desktop 1440×1000 | Lulus |
| Uji tampilan ponsel 390×844 | Lulus |
| Mode terang dan gelap | Lulus |
| Gulir mendatar yang tidak diinginkan | Tidak ada |

Uji tampilan mencakup dialog transaksi, kedua grafik, halaman Rencana, footer publik, dan pesan error login.

---

## 6. File yang berubah

| File | Perubahan |
|---|---|
| `src/routes/_app/app/index.tsx` | Judul halaman, garis putus-putus grafik, label kategori |
| `src/routes/_app/app/transactions.tsx` | Judul halaman, baris transaksi bukan judul, label kategori |
| `src/routes/_app/app/planning.tsx` | Judul halaman, tab satu baris, teks pencarian |
| `src/routes/_app/app/reports.tsx` | Judul halaman, batang berongga, sumbu grafik |
| `src/routes/_app/app/settings.tsx` | Judul halaman, ikon zona berbahaya |
| `src/components/ui/dialog.tsx` | Judul dan tombol menempel, penanda modal |
| `src/components/ui/segmented-control.tsx` | Tab tidak menyusut |
| `src/components/finance-visuals.tsx` | Label kategori jadi titik dan nama |
| `src/components/cycle-compare.tsx` | Teks pembanding kosong |
| `src/components/wallet-deck.tsx` | Tinggi bagian kartu yang terlihat |
| `src/components/auth-form.tsx` | Error terhubung ke kolom, fokus pindah |
| `src/components/public-shell.tsx` | Ukuran area sentuh footer |
| `src/routes/index.tsx` | Gambar contoh disembunyikan dari pembaca layar |
| `src/routes/help.tsx` | Pratinjau ponsel disembunyikan |

Commit: `433a5ba` dengan pesan "Apply HIG review fixes across app and public pages".

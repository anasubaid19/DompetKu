# Product Requirements Document: DompetKu

## 1. Executive Summary

### Problem Statement

DompetKu saat ini adalah aplikasi pencatatan keuangan single-user berbasis satu file HTML dan `localStorage`. Data tidak dapat disinkronkan lintas perangkat, struktur kode sulit dikembangkan, dan pengalaman desktop/mobile belum menggunakan sistem desain yang konsisten.

### Proposed Solution

Bangun ulang DompetKu sebagai web-app multi-user dengan TanStack Start, Better Auth, dan SQLite. Seluruh fitur finansial yang ada dipertahankan, tetapi UI dibangun ulang memakai bahasa visual faiz-ui: Geist, token warna OKLCH, komponen shadcn/ui berbasis Base UI, Hugeicons, light-first dengan dark mode, dan motion yang responsif serta ramah reduced-motion.

### Success Criteria

- Pengguna dapat mendaftar, masuk, keluar, dan hanya mengakses data miliknya sendiri.
- Seluruh perubahan saldo dan transaksi tersimpan atomik di SQLite tanpa saldo parsial.
- Alur utama (login, tambah dompet, catat transaksi, lihat ringkasan) selesai tanpa horizontal overflow pada lebar 390px dan 1280px.
- `bun run check`, `bun run typecheck`, dan `bun test` lulus.
- Kontrol utama dapat digunakan dengan keyboard dan memiliki nama aksesibel.

## 2. User Experience & Functionality

### User Personas

- **Pencatat harian**: mencatat pemasukan dan pengeluaran dengan cepat dari ponsel.
- **Perencana keuangan**: mengatur budget kategori, target tabungan, dan langganan rutin.
- **Pengguna multi-perangkat**: membutuhkan data yang konsisten setelah login dari perangkat lain.

### User Stories

#### Akun

- Sebagai pengguna baru, saya ingin membuat akun agar data keuangan saya bersifat pribadi.
- Sebagai pengguna lama, saya ingin login dan logout dengan aman.

Acceptance criteria:

- Email wajib valid, password minimal 8 karakter, dan error ditampilkan dekat formulir.
- Route aplikasi dan semua server function finansial menolak sesi yang tidak valid.
- Setelah login, pengguna diarahkan ke dashboard.

#### Dashboard dan Dompet

- Sebagai pengguna, saya ingin melihat total saldo, pemasukan, pengeluaran, dan dompet saya pada satu layar.
- Sebagai pengguna, saya ingin membuat dompet harian atau tabungan.

Acceptance criteria:

- Dashboard menampilkan ringkasan periode berjalan dan transaksi terbaru.
- Saldo dapat disembunyikan tanpa menghapus data.
- Pengguna baru memperoleh kategori awal yang dapat diedit kemudian.

#### Transaksi

- Sebagai pengguna, saya ingin mencatat pemasukan, pengeluaran, dan transfer antar-dompet.

Acceptance criteria:

- Nominal harus lebih dari nol dan dompet wajib dipilih.
- Pengeluaran gagal jika saldo tidak mencukupi.
- Transfer mengurangi dompet asal dan menambah dompet tujuan secara atomik.
- Edit dan hapus membalik dampak transaksi lama sebelum memperbarui saldo.
- Biaya transfer terlihat di histori dan dihitung sebagai pengeluaran.
- Daftar dapat dicari serta difilter berdasarkan jenis dan siklus aktif.

#### Hutang, Budget, Tabungan, dan Langganan

- Sebagai pengguna, saya ingin memantau hutang/piutang dan jatuh temponya.
- Sebagai pengguna, saya ingin menetapkan batas pengeluaran dan target tabungan.
- Sebagai pengguna, saya ingin mencatat tagihan rutin.

Acceptance criteria:

- Hutang/piutang memiliki status aktif/lunas dan indikator jatuh tempo.
- Budget membandingkan batas dengan realisasi kategori pada periode berjalan.
- Target tabungan menunjukkan progress nominal dan persentase; isi/tarik memindahkan saldo antar-dompet secara atomik.
- Langganan menampilkan tanggal tagihan berikutnya.

#### Laporan dan Pengaturan

- Sebagai pengguna, saya ingin melihat komposisi pengeluaran dan kekayaan bersih.
- Sebagai pengguna, saya ingin memilih tema, mata uang, siklus laporan, serta export/import data.

Acceptance criteria:

- Laporan memakai data pengguna aktif dan format mata uang pilihannya.
- Dashboard, budget, grafik, dan filter transaksi memakai tanggal mulai serta panjang siklus pilihan pengguna.
- Export JSON mencakup seluruh domain finansial pengguna.
- Import memvalidasi bentuk data serta memulihkan settings, warna, dan ikon sebelum menulis ke database.
- Reset data membutuhkan konfirmasi eksplisit.

### Non-Goals

- Integrasi bank otomatis, open banking, pembayaran, dan investasi.
- Kolaborasi keluarga/organisasi, role, dan approval workflow.
- Mode offline penuh dan conflict resolution lintas perangkat.
- Pengiriman email reminder; v1 hanya menampilkan reminder di aplikasi.

## 3. AI System Requirements

Tidak ada fitur AI pada v1.

## 4. Technical Specifications

### Architecture Overview

- **UI**: React 19 + TanStack Start file routes.
- **Design system**: Tailwind CSS v4, shadcn composition, Base UI primitives, Hugeicons, Geist Variable.
- **Auth**: Better Auth email/password, cookie session, catch-all `/api/auth/$`.
- **Server boundary**: TanStack `createServerFn` + auth middleware; `user.id` selalu berasal dari sesi, tidak dari input client.
- **Database**: `bun:sqlite`, foreign keys aktif, WAL mode, integer rupiah, transaksi atomik.
- **Quality**: TypeScript strict, Biome, Bun test, agent-browser untuk desktop/mobile smoke test.

### Data Model

- Better Auth: `user`, `session`, `account`, `verification`.
- Product: `wallets`, `categories`, `transactions`, `debts`, `budgets`, `savings`, `subscriptions`, `user_settings`.
- Semua tabel produk memiliki `user_id`; query dan mutation wajib menyertakannya.

### Integration Points

- Better Auth React client untuk sign-up/sign-in/sign-out.
- Browser download/upload untuk export/import JSON.
- Tidak ada layanan eksternal pada v1.

### Security & Privacy

- Password di-hash dan sesi dikelola Better Auth.
- CSRF/origin checks tidak dinonaktifkan.
- Query terparameterisasi; tidak ada SQL dari string input.
- Error server tidak mengekspos detail database.
- File SQLite dan `.env` diabaikan Git.

## 5. Risks & Roadmap

### Phased Rollout

- **MVP**: auth, dashboard, dompet, transaksi, hutang/piutang, budget, tabungan, laporan, settings dasar.
- **v1.1**: migrasi backup legacy/CSV, subscription reminder, edit/delete domain perencanaan, audit accessibility lanjutan.
- **v2.0**: deployment database network bila perlu horizontal scaling; opsional PWA/offline cache.

### Technical Risks

- SQLite file lokal membutuhkan persistent disk dan satu writer; migrasi ke database network diperlukan saat multi-instance.
- `bun:sqlite` mengunci runtime produksi ke Bun.
- Port dari localStorage berisiko mengubah perilaku saldo; invariants transaksi diuji terpisah.
- Corpus lama satu file memiliki coupling tinggi; perilaku dipindahkan berdasarkan domain, bukan diterjemahkan baris demi baris.

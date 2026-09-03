import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BookOpen01Icon,
  Download01Icon,
  ScreenAddToHomeIcon,
  Settings01Icon,
  TransactionHistoryIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { PublicFooter, PublicHeader } from "@/components/public-shell"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Tutorial & FAQ — DompetKu" },
      {
        name: "description",
        content: "Panduan interaktif instalasi, backup, kategori, dan transaksi DompetKu.",
      },
    ],
  }),
  component: HelpPage,
})

const guides = [
  {
    id: "android",
    title: "Install di Android",
    short: "Pasang dari Chrome",
    icon: ScreenAddToHomeIcon,
    steps: [
      ["Buka lewat Chrome", "Kunjungi DompetKu menggunakan Chrome di ponsel Android."],
      ["Buka menu browser", "Ketuk ikon tiga titik di kanan atas Chrome."],
      ["Pilih Install aplikasi", "Jika opsi ini belum muncul, pilih Tambahkan ke layar utama."],
      ["Konfirmasi instalasi", "DompetKu akan muncul di layar utama dan terbuka seperti aplikasi."],
    ],
  },
  {
    id: "ios",
    title: "Install di iPhone",
    short: "Pasang dari Safari",
    icon: ScreenAddToHomeIcon,
    steps: [
      ["Buka lewat Safari", "Instalasi iOS harus dimulai dari Safari, bukan browser lain."],
      ["Ketuk tombol Bagikan", "Cari ikon kotak dengan panah ke atas pada toolbar Safari."],
      ["Pilih Tambah ke Layar Utama", "Geser daftar tindakan jika opsi belum terlihat."],
      ["Ketuk Tambah", "DompetKu siap dibuka dari layar utama tanpa tab browser."],
    ],
  },
  {
    id: "backup",
    title: "Backup & pulihkan data",
    short: "Amankan semua data",
    icon: Download01Icon,
    action: { label: "Buka Pengaturan", to: "/app/settings" as const },
    steps: [
      ["Masuk ke Pengaturan", "Buka menu Pengaturan, lalu cari kartu Backup & restore."],
      ["Unduh Export JSON", "File JSON berisi dompet, transaksi, rencana, dan preferensi akunmu."],
      ["Simpan di tempat aman", "Pindahkan file ke penyimpanan cloud atau perangkat cadangan."],
      [
        "Pulihkan saat dibutuhkan",
        "Pilih Import JSON. Data aktif akan diganti setelah file tervalidasi.",
      ],
    ],
  },
  {
    id: "category",
    title: "Atur kategori",
    short: "Buat kategori pribadi",
    icon: Settings01Icon,
    action: { label: "Atur kategori", to: "/app/settings" as const },
    steps: [
      ["Buka Pengaturan", "Cari kartu Kategori kustom pada halaman Pengaturan."],
      ["Ketuk tombol tambah", "Pilih jenis pemasukan atau pengeluaran sesuai kebutuhan."],
      ["Beri identitas", "Masukkan nama singkat, lalu pilih warna dan ikon yang mudah dikenali."],
      ["Simpan kategori", "Kategori baru langsung tersedia pada dialog Catat transaksi."],
    ],
  },
  {
    id: "transaction",
    title: "Catat transaksi",
    short: "Rekam uang masuk & keluar",
    icon: TransactionHistoryIcon,
    action: { label: "Buka Ringkasan", to: "/app" as const },
    steps: [
      ["Ketuk Catat transaksi", "Tombol tersedia pada Ringkasan dan halaman Transaksi."],
      ["Pilih jenis", "Gunakan Pengeluaran, Pemasukan, atau Transfer antar-dompet."],
      ["Lengkapi detail", "Isi nominal, dompet, kategori, tanggal, dan catatan bila diperlukan."],
      ["Simpan", "Saldo dompet dan laporan akan diperbarui secara otomatis."],
    ],
  },
] as const

function HelpPage() {
  const [guideIndex, setGuideIndex] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const guide = guides[guideIndex]
  const step = guide.steps[stepIndex]

  function selectGuide(index: number) {
    setGuideIndex(index)
    setStepIndex(0)
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <PublicHeader />
      <main>
        <section className="relative border-b">
          <div aria-hidden className="surface-grid absolute inset-0 opacity-60" />
          <div className="relative mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24 lg:px-9">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={BookOpen01Icon} />
            </span>
            <p className="text-caption mt-8 uppercase tracking-[0.16em]">Tutorial & FAQ</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
              Belajar sambil mencoba.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Pilih panduan, lanjutkan setiap langkah, lalu buka bagian aplikasi yang terkait saat
              kamu siap mempraktikkannya.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-20 lg:px-9">
          <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
            <fieldset className="grid content-start gap-2 border-0 p-0">
              <legend className="sr-only">Daftar tutorial</legend>
              {guides.map((item, index) => (
                <Button
                  aria-pressed={guideIndex === index}
                  className="h-auto min-h-14 w-full justify-start whitespace-normal rounded-2xl px-4 text-left"
                  key={item.id}
                  onClick={() => selectGuide(index)}
                  variant={guideIndex === index ? "default" : "outline"}
                >
                  <HugeiconsIcon className="size-5 shrink-0" icon={item.icon} />
                  <span>
                    <strong className="block font-medium text-current">{item.title}</strong>
                    <span className="mt-0.5 block text-xs opacity-70">{item.short}</span>
                  </span>
                </Button>
              ))}
            </fieldset>

            <div className="overflow-hidden rounded-4xl border bg-card shadow-xl shadow-primary/5">
              <div className="grid lg:grid-cols-[1fr_0.82fr]">
                <div className="p-6 sm:p-9">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-caption uppercase tracking-[0.14em]">
                        Langkah {stepIndex + 1} dari {guide.steps.length}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
                        {guide.title}
                      </h2>
                    </div>
                    <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <HugeiconsIcon icon={guide.icon} />
                    </span>
                  </div>
                  <fieldset className="mt-8 flex gap-2 border-0 p-0">
                    <legend className="sr-only">Kemajuan tutorial</legend>
                    {guide.steps.map((item, index) => (
                      <button
                        aria-current={index === stepIndex ? "step" : undefined}
                        aria-label={`Buka langkah ${index + 1}: ${item[0]}`}
                        className="relative h-11 flex-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        key={item[0]}
                        onClick={() => setStepIndex(index)}
                        type="button"
                      >
                        <span
                          className={`absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full ${
                            index <= stepIndex ? "bg-primary" : "bg-secondary"
                          } ${index === stepIndex ? "ring-2 ring-primary/35 ring-offset-2 ring-offset-card" : ""}`}
                        />
                      </button>
                    ))}
                  </fieldset>
                  <div aria-live="polite" className="mt-10 min-h-36">
                    <p className="text-sm font-medium tabular-nums text-primary">
                      {String(stepIndex + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">{step[0]}</h3>
                    <p className="mt-3 max-w-lg leading-7 text-muted-foreground">{step[1]}</p>
                  </div>
                  <div className="mt-8 flex flex-wrap items-center gap-2">
                    <Button
                      aria-label="Langkah sebelumnya"
                      disabled={stepIndex === 0}
                      onClick={() => setStepIndex((index) => index - 1)}
                      size="icon"
                      variant="outline"
                    >
                      <HugeiconsIcon icon={ArrowLeft01Icon} />
                    </Button>
                    {stepIndex < guide.steps.length - 1 ? (
                      <Button onClick={() => setStepIndex((index) => index + 1)}>
                        Langkah berikutnya <HugeiconsIcon icon={ArrowRight01Icon} />
                      </Button>
                    ) : "action" in guide ? (
                      <Button render={<Link to={guide.action.to} />}>
                        {guide.action.label} <HugeiconsIcon icon={ArrowRight01Icon} />
                      </Button>
                    ) : (
                      <Button render={<Link to="/register" />}>
                        Mulai gunakan DompetKu <HugeiconsIcon icon={ArrowRight01Icon} />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="border-t bg-secondary/45 p-6 lg:border-l lg:border-t-0 sm:p-9">
                  <div className="mx-auto max-w-[310px] rounded-[2rem] border-[6px] border-foreground bg-background p-4 shadow-xl">
                    <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-foreground/15" />
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      DompetKu / Panduan
                    </p>
                    <div className="mt-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/6">
                      <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
                        <HugeiconsIcon className="size-5" icon={guide.icon} />
                      </span>
                      <p className="mt-6 text-xs font-medium text-primary">
                        <span className="uppercase">Langkah</span> {stepIndex + 1}
                      </p>
                      <p className="mt-2 font-semibold">{step[0]}</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{step[1]}</p>
                      <div className="mt-6 h-10 rounded-xl bg-primary/12 ring-1 ring-primary/15" />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <span className="h-12 rounded-xl bg-secondary" />
                      <span className="h-12 rounded-xl bg-primary/15" />
                      <span className="h-12 rounded-xl bg-secondary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-card">
          <div className="mx-auto max-w-[900px] px-4 py-16 sm:px-6 sm:py-20">
            <p className="text-caption uppercase tracking-[0.16em]">Pertanyaan umum</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              Hal yang perlu diketahui
            </h2>
            <div className="mt-8 grid gap-3">
              {[
                [
                  "Apakah DompetKu bisa dipakai tanpa instalasi?",
                  "Bisa. DompetKu tetap berjalan di browser. Instalasi hanya membuat aksesnya lebih cepat dan tampil seperti aplikasi.",
                ],
                [
                  "Apakah backup JSON bisa dibuka di Excel?",
                  "Backup JSON ditujukan untuk pemulihan lengkap. Gunakan Export CSV transaksi jika ingin menganalisis data di spreadsheet.",
                ],
                [
                  "Apa yang terjadi saat Import JSON?",
                  "Data finansial aktif akan diganti setelah file berhasil divalidasi. Unduh backup terbaru sebelum melakukan pemulihan.",
                ],
                [
                  "Apakah data satu akun terlihat oleh akun lain?",
                  "Tidak. Dompet, transaksi, kategori, dan rencana selalu dibatasi ke akun yang sedang masuk.",
                ],
              ].map(([question, answer]) => (
                <details className="group rounded-2xl border bg-background px-5" key={question}>
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-xl font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                    <span>{question}</span>
                    <HugeiconsIcon
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground transition-transform duration-fast group-open:rotate-90"
                      icon={ArrowRight01Icon}
                    />
                  </summary>
                  <p className="max-w-2xl pb-5 text-sm leading-6 text-muted-foreground">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}

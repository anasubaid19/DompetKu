import {
  ArrowRight01Icon,
  Chart03Icon,
  CheckmarkCircle02Icon,
  SecurityCheckIcon,
  Target01Icon,
  TransactionHistoryIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { PublicFooter, PublicHeader } from "@/components/public-shell"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DompetKu — Keuangan pribadi, lebih tenang" },
      {
        name: "description",
        content:
          "Catat transaksi, atur budget, kejar target tabungan, dan pahami arus kas dalam satu ruang finansial pribadi.",
      },
    ],
  }),
  component: LandingPage,
})

const features = [
  {
    icon: Wallet01Icon,
    number: "01",
    title: "Semua dompet, satu pandangan",
    text: "Satukan rekening, uang tunai, dan tabungan tanpa kehilangan konteks sumber dana.",
  },
  {
    icon: TransactionHistoryIcon,
    number: "02",
    title: "Transaksi yang mudah dilacak",
    text: "Catat pemasukan, pengeluaran, dan transfer lengkap dengan kategori dan catatan.",
  },
  {
    icon: Target01Icon,
    number: "03",
    title: "Rencana yang benar-benar terhubung",
    text: "Budget, target tabungan, hutang, piutang, dan langganan hidup bersama data aktualmu.",
  },
  {
    icon: Chart03Icon,
    number: "04",
    title: "Laporan tanpa kebisingan",
    text: "Lihat pola enam siklus, kategori terbesar, dan arus kas yang perlu perhatian.",
  },
] as const

function LandingPage() {
  return (
    <div className="min-h-svh overflow-hidden bg-background text-foreground">
      <a
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:translate-y-0"
        href="#main-content"
      >
        Lewati ke konten utama
      </a>
      <PublicHeader />

      <main id="main-content">
        <section className="relative border-b">
          <div aria-hidden className="surface-grid absolute inset-0 opacity-70" />
          <div
            aria-hidden
            className="absolute left-[8%] top-20 size-64 rounded-full bg-primary/12 blur-3xl"
          />
          <div className="relative mx-auto grid max-w-[1200px] gap-14 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-9 lg:py-36">
            <div className="max-w-2xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                <span className="size-1.5 rounded-full bg-success" />
                Ruang finansial pribadi yang tenang
              </div>
              <h1 className="max-w-[720px] text-[clamp(2.8rem,7vw,6.4rem)] font-semibold leading-[0.92] tracking-[-0.075em]">
                Uangmu jelas.
                <span className="block text-primary">Pikiranmu lega.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                DompetKu menyatukan transaksi, budget, tabungan, dan kewajiban dalam satu pandangan
                yang mudah dipahami.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button className="h-12 px-5" render={<Link to="/register" />} size="lg">
                  Mulai catat gratis <HugeiconsIcon icon={ArrowRight01Icon} />
                </Button>
                <Button
                  className="h-12 px-5"
                  render={<Link to="/help" />}
                  size="lg"
                  variant="outline"
                >
                  Lihat cara kerjanya
                </Button>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {["Tanpa kartu kredit", "Data privat per akun", "Bisa dipasang di ponsel"].map(
                  (item) => (
                    <span className="inline-flex items-center gap-1.5" key={item}>
                      <HugeiconsIcon className="size-4 text-success" icon={CheckmarkCircle02Icon} />
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            <DashboardPreview />
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-28 lg:px-9" id="fitur">
          <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-caption uppercase tracking-[0.16em]">Satu alur, bukan lima alat</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Catat hari ini. Pahami besok.
              </h2>
              <p className="mt-5 max-w-md leading-7 text-muted-foreground">
                Setiap fitur memakai data yang sama. Tidak ada angka yang perlu disalin dari satu
                tempat ke tempat lain.
              </p>
            </div>
            <div className="grid border-t">
              {features.map((feature) => (
                <article
                  className="grid gap-4 border-b py-7 sm:grid-cols-[4rem_1fr_auto] sm:items-start sm:py-9"
                  key={feature.number}
                >
                  <span className="text-caption font-medium">{feature.number}</span>
                  <div>
                    <h3 className="text-xl font-semibold tracking-[-0.025em]">{feature.title}</h3>
                    <p className="mt-2 max-w-xl leading-7 text-muted-foreground">{feature.text}</p>
                  </div>
                  <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <HugeiconsIcon icon={feature.icon} />
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y bg-card" id="cara-kerja">
          <div className="mx-auto grid max-w-[1200px] gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:items-center lg:px-9">
            <div className="relative min-h-[420px] overflow-hidden rounded-4xl bg-foreground p-6 text-background shadow-2xl sm:p-8">
              <div aria-hidden className="absolute inset-0 opacity-15 surface-grid" />
              <div className="relative flex h-full flex-col justify-between gap-16">
                <div className="flex items-center justify-between text-xs opacity-60">
                  <span className="uppercase">Siklus aktif</span>
                  <span className="uppercase tabular-nums">01 — 30 Sep</span>
                </div>
                <div>
                  <p className="text-sm opacity-60">Sisa budget bulan ini</p>
                  <p className="mt-3 text-5xl font-semibold tracking-[-0.06em] sm:text-6xl">
                    Rp2.475.000
                  </p>
                  <div className="mt-8 h-2 overflow-hidden rounded-full bg-background/15">
                    <div className="h-full w-[62%] rounded-full bg-primary" />
                  </div>
                </div>
                <p className="max-w-sm text-sm leading-6 opacity-65">
                  Pengeluaran makan masih aman. Tagihan rutin berikutnya jatuh tempo dalam 4 hari.
                </p>
              </div>
            </div>
            <div>
              <p className="text-caption uppercase tracking-[0.16em]">Cara kerja</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Mulai tanpa ritual rumit.
              </h2>
              <ol className="mt-9 grid gap-7">
                {[
                  [
                    "01",
                    "Tambahkan dompet",
                    "Masukkan rekening, uang tunai, atau dompet tabungan.",
                  ],
                  ["02", "Catat transaksi", "Pilih sumber dana, kategori, nominal, dan tanggal."],
                  [
                    "03",
                    "Buat rencana",
                    "Pasang budget dan target dari kondisi keuanganmu sendiri.",
                  ],
                  ["04", "Tinjau laporan", "Lihat pola, bukan sekadar tumpukan angka."],
                ].map(([number, title, text]) => (
                  <li className="grid grid-cols-[2.5rem_1fr] gap-4" key={number}>
                    <span className="text-sm font-semibold text-primary">{number}</span>
                    <div>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-28 lg:px-9">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-4xl border bg-card p-7 sm:p-10">
              <span className="grid size-12 place-items-center rounded-2xl bg-success/10 text-success">
                <HugeiconsIcon icon={SecurityCheckIcon} />
              </span>
              <h2 className="mt-8 max-w-xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                Datamu tetap milikmu.
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
                Setiap akun memiliki ruang data terpisah. Unduh backup JSON lengkap kapan saja, lalu
                pulihkan kembali saat dibutuhkan.
              </p>
            </div>
            <div className="rounded-4xl bg-primary p-7 text-primary-foreground sm:p-10">
              <p className="text-xs font-medium uppercase tracking-[0.16em] opacity-70">
                Panduan interaktif
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.045em]">
                Tidak perlu menebak tombol berikutnya.
              </h2>
              <p className="mt-4 leading-7 opacity-80">
                Ikuti demo untuk instalasi Android dan iOS, backup, kategori, dan transaksi.
              </p>
              <Button
                className="mt-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                render={<Link to="/help" />}
              >
                Buka tutorial <HugeiconsIcon icon={ArrowRight01Icon} />
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto max-w-[1200px] px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-9">
            <p className="text-caption uppercase tracking-[0.16em]">Mulai dari satu catatan</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
              Beri setiap rupiah tempat yang jelas.
            </h2>
            <Button className="mt-8 h-12 px-6" render={<Link to="/register" />} size="lg">
              Buat ruang finansialmu <HugeiconsIcon icon={ArrowRight01Icon} />
            </Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] lg:ml-auto">
      <div
        aria-hidden
        className="absolute -inset-5 -rotate-2 rounded-[2.8rem] bg-primary/12 sm:rounded-[3.3rem]"
      />
      <div className="relative overflow-hidden rounded-[2.5rem] bg-card p-4 shadow-2xl shadow-primary/10 ring-1 ring-foreground/10 sm:rounded-[3rem] sm:p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
              <HugeiconsIcon className="size-4" icon={Wallet01Icon} />
            </span>
            <span className="text-sm font-semibold">Ringkasan</span>
          </div>
          <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            Siklus sehat
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl bg-foreground p-5 text-background sm:col-span-2">
            <p className="text-xs uppercase opacity-55">Total saldo</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">Rp12.850.000</p>
            <div className="mt-7 flex h-20 items-end gap-2" aria-hidden>
              {[34, 48, 42, 66, 58, 79, 72, 88, 76, 94].map((height, index) => (
                <span
                  className="flex-1 rounded-t-md bg-primary"
                  key={height}
                  style={{ height: `${height}%`, opacity: 0.45 + index * 0.045 }}
                />
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-success/8 p-4">
            <p className="text-xs text-muted-foreground">Pemasukan</p>
            <p className="mt-2 font-semibold text-success">+Rp7.500.000</p>
          </div>
          <div className="rounded-2xl bg-destructive/8 p-4">
            <p className="text-xs text-muted-foreground">Pengeluaran</p>
            <p className="mt-2 font-semibold">−Rp4.175.000</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          {["Belanja bulanan", "Transfer ke tabungan", "Tagihan internet"].map((item, index) => (
            <div className="flex items-center gap-3" key={item}>
              <span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary">
                <HugeiconsIcon className="size-4" icon={TransactionHistoryIcon} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item}</p>
                <p className="text-caption mt-0.5">Hari ini · Dompet utama</p>
              </div>
              <span className="text-xs font-semibold tabular-nums">
                {index === 1 ? "Rp500.000" : `−Rp${index === 0 ? "325.000" : "280.000"}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

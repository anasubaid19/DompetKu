import { cn } from "@/lib/utils"

function Bone({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-lg bg-secondary motion-reduce:animate-none", className)}
    />
  )
}

export function AppSkeleton() {
  return (
    <div className="min-h-svh bg-background text-foreground" role="status">
      <span className="sr-only">Memuat halaman…</span>
      <div
        aria-hidden
        className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-sidebar/88 px-3 py-4 lg:flex"
      >
        <div className="mb-7 flex items-center gap-3 px-2">
          <Bone className="size-10 rounded-2xl" />
          <div className="grid gap-2">
            <Bone className="h-3.5 w-24" />
            <Bone className="h-2.5 w-16" />
          </div>
        </div>
        <div className="grid gap-1">
          {[0, 1, 2, 3, 4].map((item) => (
            <Bone className="h-11 rounded-xl" key={item} />
          ))}
        </div>
      </div>

      <div className="lg:pl-64">
        <div
          aria-hidden
          className="sticky top-0 z-30 h-16 border-b bg-background/82 px-4 backdrop-blur-xl sm:px-6 lg:px-9"
        >
          <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between">
            <Bone className="h-3.5 w-40" />
            <Bone className="size-9 rounded-xl" />
          </div>
        </div>

        <main className="mx-auto min-h-[calc(100svh-4rem)] max-w-[1200px] px-4 pb-28 pt-6 sm:px-6 lg:px-9 lg:pb-10">
          <div aria-hidden className="grid grid-cols-1 gap-6">
            <div className="grid gap-2">
              <Bone className="h-2.5 w-24" />
              <Bone className="h-7 w-52 max-w-full" />
              <Bone className="h-3 w-72 max-w-full" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <Bone className="h-24 rounded-3xl" key={item} />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
              <Bone className="h-72 rounded-3xl" />
              <div className="grid gap-4">
                <Bone className="h-32 rounded-3xl" />
                <Bone className="h-32 rounded-3xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

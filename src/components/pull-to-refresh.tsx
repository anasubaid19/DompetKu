import { Loading03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const THRESHOLD = 70
const MAX_PULL = 120
const RESISTANCE = 0.5
const RESTING = 52
const MIN_SPINNER_MS = 400

export function PullToRefresh() {
  const router = useRouter()
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [settling, setSettling] = useState(false)
  const pullRef = useRef(0)
  const refreshRef = useRef(false)

  useEffect(() => {
    let startY = 0
    let tracking = false
    let pulling = false

    const applyPull = (value: number) => {
      pullRef.current = value
      setPull(value)
    }

    const blocked = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false
      if (target.closest('[role="dialog"],[data-ptr-ignore]')) return true
      let el: Element | null = target
      while (el && el !== document.body) {
        const style = getComputedStyle(el)
        if (/(auto|scroll)/.test(style.overflowX) && el.scrollWidth > el.clientWidth) return true
        if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight) return true
        el = el.parentElement
      }
      return false
    }

    const runRefresh = async () => {
      if (refreshRef.current) return
      refreshRef.current = true
      setRefreshing(true)
      setSettling(false)
      applyPull(RESTING)
      try {
        await Promise.all([
          router.invalidate(),
          new Promise((resolve) => window.setTimeout(resolve, MIN_SPINNER_MS)),
        ])
      } finally {
        refreshRef.current = false
        setRefreshing(false)
        setSettling(true)
        applyPull(0)
      }
    }

    const onStart = (event: TouchEvent) => {
      if (refreshRef.current) return
      if (event.touches.length !== 1) return
      if (window.scrollY > 0) return
      if (blocked(event.target)) return
      startY = event.touches[0].clientY
      tracking = true
      pulling = false
    }

    const onMove = (event: TouchEvent) => {
      if (!tracking || refreshRef.current) return
      if (event.touches.length !== 1) {
        tracking = false
        pulling = false
        setSettling(false)
        applyPull(0)
        return
      }
      if (window.scrollY > 0) {
        tracking = false
        pulling = false
        applyPull(0)
        return
      }
      const dy = event.touches[0].clientY - startY
      if (dy <= 0) {
        if (pulling) {
          pulling = false
          applyPull(0)
        }
        return
      }
      pulling = true
      setSettling(false)
      applyPull(Math.min(MAX_PULL, dy * RESISTANCE))
      if (event.cancelable) event.preventDefault()
    }

    const onEnd = () => {
      if (!tracking) return
      const wasPulling = pulling
      tracking = false
      pulling = false
      if (wasPulling && pullRef.current >= THRESHOLD) {
        void runRefresh()
      } else if (wasPulling) {
        setSettling(true)
        applyPull(0)
      }
    }

    window.addEventListener("touchstart", onStart, { passive: true })
    window.addEventListener("touchmove", onMove, { passive: false })
    window.addEventListener("touchend", onEnd)
    window.addEventListener("touchcancel", onEnd)
    const root = document.documentElement
    const previousOverscroll = root.style.overscrollBehaviorY
    root.style.overscrollBehaviorY = "contain"
    return () => {
      window.removeEventListener("touchstart", onStart)
      window.removeEventListener("touchmove", onMove)
      window.removeEventListener("touchend", onEnd)
      window.removeEventListener("touchcancel", onEnd)
      root.style.overscrollBehaviorY = previousOverscroll
    }
  }, [router])

  const progress = Math.min(1, pull / THRESHOLD)
  const visible = refreshing || pull > 6
  const label = refreshing
    ? "Memuat…"
    : pull >= THRESHOLD
      ? "Lepaskan untuk memuat ulang"
      : "Tarik untuk memuat ulang"

  return (
    <div
      aria-hidden={!refreshing}
      className="pointer-events-none fixed inset-x-0 top-16 z-30 flex justify-center"
    >
      <div
        aria-live="polite"
        className={cn(
          "flex items-center gap-2 rounded-full bg-card px-3.5 py-2 text-xs font-medium text-foreground shadow-lg ring-1 ring-foreground/8 motion-reduce:transition-none",
          settling || refreshing
            ? "transition-[transform,opacity] duration-200 ease-entrance"
            : "transition-opacity duration-150",
        )}
        role="status"
        style={{
          opacity: visible ? 1 : 0,
          transform: `translateY(${refreshing ? 8 : Math.min(20, pull * 0.25) - 24}px) scale(${0.85 + progress * 0.15})`,
        }}
      >
        <HugeiconsIcon
          className={cn("size-4 shrink-0 text-primary", refreshing && "animate-spin")}
          icon={Loading03Icon}
          style={refreshing ? undefined : { transform: `rotate(${Math.round(progress * 300)}deg)` }}
        />
        <span>{label}</span>
      </div>
    </div>
  )
}

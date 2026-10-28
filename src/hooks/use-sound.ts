import { useCallback, useRef } from "react"
import { playSound } from "@/lib/sound-engine"
import type { SoundAsset } from "@/lib/sound-types"

export interface UseSoundOptions {
  volume?: number
  playbackRate?: number
}

export function useSound(sound: SoundAsset, options: UseSoundOptions = {}) {
  const playbackRef = useRef<{ stop: () => void } | null>(null)

  const play = useCallback(() => {
    playSound(sound.dataUri, options)
      .then((playback) => {
        playbackRef.current = playback
      })
      .catch(() => {
        // Audio may be blocked until a user gesture; ignore.
      })
  }, [sound, options])

  const stop = useCallback(() => {
    playbackRef.current?.stop()
  }, [])

  return [play, { stop }] as const
}

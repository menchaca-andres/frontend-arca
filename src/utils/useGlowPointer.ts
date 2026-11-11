import { useEffect } from 'react'

const SELECTOR = '.card-ds, .stat-card, .module-card-ds'

export function useGlowPointer() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    let frame = 0
    let lastEvent: PointerEvent | null = null

    const update = () => {
      frame = 0
      if (!lastEvent) return
      const target = (lastEvent.target as Element | null)?.closest<HTMLElement>(SELECTOR)
      if (target) {
        const rect = target.getBoundingClientRect()
        target.style.setProperty('--mouse-x', `${lastEvent.clientX - rect.left}px`)
        target.style.setProperty('--mouse-y', `${lastEvent.clientY - rect.top}px`)
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      lastEvent = e
      if (!frame) frame = requestAnimationFrame(update)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
}

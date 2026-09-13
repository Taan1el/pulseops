import { useEffect } from 'react'

/**
 * Closes the caller (typically a modal) when the user presses Escape.
 * Does nothing while `active` is false, so closed modals do not attach a
 * listener at all.
 */
export function useEscapeToClose(active: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!active) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [active, onClose])
}

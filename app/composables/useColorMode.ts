/**
 * SSR-safe composable for managing dark/light mode.
 *
 * - Persists preference to `localStorage` under the key `matrix-color-mode`.
 * - Defaults to light mode on first visit.
 * - Toggles the `.dark` class on `<html>` for Tailwind's dark variant.
 *
 * Must be called in `<script setup>` context.
 */
export function useColorMode() {
  const colorMode = useState<'light' | 'dark'>('color-mode', () => 'light')
  const isDark = computed(() => colorMode.value === 'dark')

  function applyClass() {
    if (import.meta.server) return
    if (colorMode.value === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  /** Toggle between light and dark mode. */
  function toggle() {
    colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'
    applyClass()
    if (import.meta.client) {
      localStorage.setItem('matrix-color-mode', colorMode.value)
    }
  }

  /** Set a specific mode. */
  function set(mode: 'light' | 'dark') {
    colorMode.value = mode
    applyClass()
    if (import.meta.client) {
      localStorage.setItem('matrix-color-mode', mode)
    }
  }

  // Read from localStorage on mount (client only)
  if (import.meta.client) {
    onMounted(() => {
      const stored = localStorage.getItem('matrix-color-mode') as 'light' | 'dark' | null
      if (stored) {
        colorMode.value = stored
      } else {
        colorMode.value = 'light'
      }
      applyClass()
    })
  }

  return { colorMode, isDark, toggle, set }
}

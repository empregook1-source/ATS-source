export function useCspNonce() {
  return useState<string>('csp-nonce', () => {
    const event = useRequestEvent()
    const context = event?.context as { cspNonce?: string } | undefined
    return context?.cspNonce ?? ''
  })
}

export function useTrack() {
  function track(eventName: string, properties?: Record<string, unknown>) {
    void eventName
    void properties
  }

  function captureError(error: unknown, properties?: Record<string, unknown>) {
    void error
    void properties
  }

  return { track, captureError }
}

type CookieConsentPreferences = {
  version: number
  necessary: true
  analytics: boolean
  marketing: boolean
  updatedAt: string
}

const COOKIE_CONSENT_KEY = 'matrix_cookie_consent'
const COOKIE_CONSENT_VERSION = 1

function createConsentPayload(
  partial?: Partial<Pick<CookieConsentPreferences, 'analytics' | 'marketing'>>,
): CookieConsentPreferences {
  return {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    analytics: partial?.analytics ?? false,
    marketing: partial?.marketing ?? false,
    updatedAt: new Date().toISOString(),
  }
}

function isValidConsent(
  value: CookieConsentPreferences | null | undefined,
): value is CookieConsentPreferences {
  return Boolean(value && value.version === COOKIE_CONSENT_VERSION)
}

export function useCookieConsent() {
  const storedConsent = useCookie<CookieConsentPreferences | null>(COOKIE_CONSENT_KEY, {
    default: () => null,
    maxAge: 60 * 60 * 24 * 180,
    sameSite: 'lax',
    path: '/',
  })
  const isPreferencesOpen = useState('cookie-consent-preferences-open', () => false)

  const isConfigured = computed(() => isValidConsent(storedConsent.value))

  const preferences = computed<CookieConsentPreferences>(() =>
    isValidConsent(storedConsent.value)
      ? storedConsent.value
      : createConsentPayload(),
  )

  const shouldShowBanner = computed(() => !isConfigured.value)

  function persistConsent(
    partial?: Partial<Pick<CookieConsentPreferences, 'analytics' | 'marketing'>>,
  ) {
    storedConsent.value = createConsentPayload(partial)
  }

  function acceptAll() {
    persistConsent({
      analytics: true,
      marketing: true,
    })
  }

  function rejectOptional() {
    persistConsent({
      analytics: false,
      marketing: false,
    })
  }

  function savePreferences(partial: Pick<CookieConsentPreferences, 'analytics' | 'marketing'>) {
    persistConsent(partial)
  }

  function openPreferences() {
    isPreferencesOpen.value = true
  }

  function closePreferences() {
    isPreferencesOpen.value = false
  }

  if (import.meta.client) {
    watch(
      preferences,
      (value) => {
        document.documentElement.dataset.cookieConsentAnalytics = String(value.analytics)
        document.documentElement.dataset.cookieConsentMarketing = String(value.marketing)
      },
      { immediate: true },
    )
  }

  return {
    preferences,
    shouldShowBanner,
    isPreferencesOpen,
    acceptAll,
    rejectOptional,
    savePreferences,
    openPreferences,
    closePreferences,
  }
}

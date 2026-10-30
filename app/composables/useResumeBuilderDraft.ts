import { SCHOOLING_LEVELS, parseLegacySchooling } from '~~/shared/resume'

export type ResumeSchoolingItem = {
  id: string
  title: string
  status: string
  course: string
  school: string
  graduationYear: string
  studying: boolean
}

export type ResumeCourseItem = {
  id: string
  title: string
  institution: string
  completion: string
}

export type ResumeExperienceItem = {
  id: string
  title: string
  company: string
  start: string
  end: string
  period: string
  activities: string
}

export type ResumeDraftPhoto = {
  dataUrl: string
  mime: string
}

export type ResumeDraft = {
  version: 1
  updatedAt: string
  savedAt: string | null
  photo: ResumeDraftPhoto | null
  personal: {
    fullName: string
    email: string
    phone: string
    age: string
    city: string
    hasCnh: boolean
    cnhCategory: string
  }
  schooling: ResumeSchoolingItem[]
  courses: ResumeCourseItem[]
  experiences: ResumeExperienceItem[]
}

const RESUME_DRAFT_KEY = 'resume_builder_draft_v1'

function newId(): string {
  const cryptoObj = (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto
  if (cryptoObj?.randomUUID) return cryptoObj.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createDefaultDraft(): ResumeDraft {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    savedAt: null,
    photo: null,
    personal: {
      fullName: '',
      email: '',
      phone: '',
      age: '',
      city: '',
      hasCnh: false,
      cnhCategory: '',
    },
    schooling: [{
      id: newId(),
      title: '',
      status: '',
      course: '',
      school: '',
      graduationYear: '',
      studying: false,
    }],
    courses: [{
      id: newId(),
      title: '',
      institution: '',
      completion: '',
    }],
    experiences: [{
      id: newId(),
      title: '',
      company: '',
      start: '',
      end: '',
      period: '',
      activities: '',
    }],
  }
}

function isResumeDraft(value: unknown): value is ResumeDraft {
  if (!value || typeof value !== 'object') return false
  const v = value as ResumeDraft
  return v.version === 1 && !!v.personal && typeof v.personal === 'object'
}

export function useResumeBuilderDraft() {
  const draft = useState<ResumeDraft>('resume-builder-draft', () => createDefaultDraft())
  const isLoaded = useState<boolean>('resume-builder-loaded', () => false)

  function normalizeEmail(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, '')
  }

  function setPersonalEmail(value: string) {
    draft.value.personal.email = normalizeEmail(value)
  }

  function setPersonalFullName(value: string) {
    draft.value.personal.fullName = value.replace(/\s+/g, ' ').trimStart()
  }

  function setPhoto(photo: ResumeDraftPhoto | null) {
    draft.value.photo = photo
  }

  function clearPhoto() {
    draft.value.photo = null
  }

  function touchUpdatedAt() {
    draft.value.updatedAt = new Date().toISOString()
  }

  function saveNow() {
    draft.value.savedAt = new Date().toISOString()
    touchUpdatedAt()
    if (!import.meta.client) return
    localStorage.setItem(RESUME_DRAFT_KEY, JSON.stringify(draft.value))
  }

  function reset() {
    draft.value = createDefaultDraft()
    if (!import.meta.client) return
    localStorage.removeItem(RESUME_DRAFT_KEY)
  }

  function addSchooling() {
    draft.value.schooling.push({ id: newId(), title: '', status: '', course: '', school: '', graduationYear: '', studying: false })
  }

  function removeSchooling(id: string) {
    draft.value.schooling = draft.value.schooling.filter(i => i.id !== id)
    if (draft.value.schooling.length === 0) addSchooling()
  }

  function addCourse() {
    draft.value.courses.push({ id: newId(), title: '', institution: '', completion: '' })
  }

  function removeCourse(id: string) {
    draft.value.courses = draft.value.courses.filter(i => i.id !== id)
    if (draft.value.courses.length === 0) addCourse()
  }

  function addExperience() {
    draft.value.experiences.push({
      id: newId(),
      title: '',
      company: '',
      start: '',
      end: '',
      period: '',
      activities: '',
    })
  }

  function removeExperience(id: string) {
    draft.value.experiences = draft.value.experiences.filter(i => i.id !== id)
    if (draft.value.experiences.length === 0) addExperience()
  }

  if (import.meta.client) {
    onMounted(() => {
      try {
        const raw = localStorage.getItem(RESUME_DRAFT_KEY)
        if (!raw) {
          isLoaded.value = true
          return
        }
        const parsed = JSON.parse(raw) as unknown
        if (isResumeDraft(parsed)) {
          draft.value = parsed
          delete (draft.value as unknown as Record<string, unknown>).skills
          const rawPhoto = (draft.value as unknown as { photo?: unknown }).photo
          if (!rawPhoto || typeof rawPhoto !== 'object') {
            draft.value.photo = null
          } else {
            const photoCandidate = rawPhoto as Partial<ResumeDraftPhoto>
            const dataUrl = typeof photoCandidate.dataUrl === 'string' ? photoCandidate.dataUrl : ''
            const mime = typeof photoCandidate.mime === 'string' ? photoCandidate.mime : ''
            draft.value.photo = dataUrl.trim() ? { dataUrl, mime } : null
          }
          const rawPersonal = (draft.value as unknown as { personal?: unknown }).personal
          if (!rawPersonal || typeof rawPersonal !== 'object') {
            draft.value.personal = createDefaultDraft().personal
          } else {
            const personalCandidate = rawPersonal as Partial<ResumeDraft['personal']>
            if (typeof personalCandidate.age !== 'string') draft.value.personal.age = ''
            if (typeof personalCandidate.city !== 'string') draft.value.personal.city = ''
            if (typeof personalCandidate.hasCnh !== 'boolean') draft.value.personal.hasCnh = false
            if (typeof personalCandidate.cnhCategory !== 'string') draft.value.personal.cnhCategory = ''
            if (!draft.value.personal.hasCnh) draft.value.personal.cnhCategory = ''
          }
          if (!draft.value.schooling?.length) draft.value.schooling = createDefaultDraft().schooling
          if (!draft.value.courses?.length) draft.value.courses = createDefaultDraft().courses
          if (!draft.value.experiences?.length) draft.value.experiences = createDefaultDraft().experiences

          for (const exp of draft.value.experiences) {
            delete (exp as unknown as Record<string, unknown>).city
            if (typeof (exp as unknown as { start?: unknown }).start !== 'string') (exp as ResumeExperienceItem).start = ''
            if (typeof (exp as unknown as { end?: unknown }).end !== 'string') (exp as ResumeExperienceItem).end = ''
            if (typeof (exp as unknown as { period?: unknown }).period !== 'string') (exp as ResumeExperienceItem).period = ''
            if (typeof (exp as unknown as { activities?: unknown }).activities !== 'string') (exp as ResumeExperienceItem).activities = ''
          }

          for (const item of draft.value.schooling) {
            if (typeof (item as unknown as { status?: unknown }).status !== 'string') item.status = ''
            if (typeof (item as unknown as { course?: unknown }).course !== 'string') item.course = ''
            if (typeof (item as unknown as { studying?: unknown }).studying !== 'boolean') item.studying = false
            if (item.title && !(SCHOOLING_LEVELS as readonly string[]).includes(item.title)) {
              const legacy = parseLegacySchooling(item.title)
              item.title = legacy.level
              if (!item.status) item.status = legacy.status
            }
          }
        }
      } catch {
      } finally {
        isLoaded.value = true
      }
    })

    let saveTimer: ReturnType<typeof setTimeout> | null = null
    watch(
      draft,
      () => {
        touchUpdatedAt()
        if (saveTimer) clearTimeout(saveTimer)
        saveTimer = setTimeout(() => {
          localStorage.setItem(RESUME_DRAFT_KEY, JSON.stringify(draft.value))
        }, 250)
      },
      { deep: true },
    )
  }

  return {
    draft,
    isLoaded,
    setPersonalEmail,
    setPersonalFullName,
    setPhoto,
    clearPhoto,
    saveNow,
    reset,
    addSchooling,
    removeSchooling,
    addCourse,
    removeCourse,
    addExperience,
    removeExperience,
  }
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_URL: string
  readonly VITE_API_URL?: string
  readonly VITE_STORAGE_BUCKET_PROFILE?: string
  readonly VITE_STORAGE_BUCKET_COVER?: string
  readonly VITE_STORAGE_BUCKET_LOGO?: string
  readonly VITE_STORAGE_BUCKET_PORTFOLIO?: string
  readonly VITE_STORAGE_BUCKET_CARD?: string
  readonly VITE_STORAGE_BUCKET_QR?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

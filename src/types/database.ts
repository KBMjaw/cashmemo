export type ProfileVisibility = 'draft' | 'published' | 'unpublished'

export interface Profile {
  id: string
  username: string
  full_name: string
  professional_name: string | null
  professional_title: string | null
  bio: string | null
  date_of_birth: string | null
  email: string
  phone: string | null
  whatsapp: string | null
  website: string | null
  location: string | null
  profile_photo_url: string | null
  cover_photo_url: string | null
  visibility: ProfileVisibility
  show_email: boolean
  show_phone: boolean
  show_location: boolean
  search_engine_visible: boolean
  created_at: string
  updated_at: string
}

export type ProfileUpdate = Partial<
  Omit<Profile, 'id' | 'email' | 'created_at' | 'updated_at'>
>

export interface Business {
  id: string
  user_id: string
  name: string
  logo_url: string | null
  cover_image_url: string | null
  designation: string | null
  description: string | null
  website: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  maps_url: string | null
  linkedin_url: string | null
  instagram_url: string | null
  facebook_url: string | null
  youtube_url: string | null
  founded_year: number | null
  industry: string | null
  services: string[] | null
  is_primary: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type BusinessInput = Omit<
  Business,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>

export const SOCIAL_PLATFORMS = [
  'linkedin',
  'instagram',
  'facebook',
  'x',
  'youtube',
  'github',
  'threads',
  'telegram',
  'pinterest',
] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]

export interface SocialLink {
  id: string
  user_id: string
  platform: SocialPlatform
  url: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export type SocialLinkInput = Omit<SocialLink, 'id' | 'user_id' | 'created_at'>

export interface PortfolioItem {
  id: string
  user_id: string
  title: string
  description: string | null
  cover_image_url: string | null
  website_url: string | null
  category: string | null
  skills: string[] | null
  start_date: string | null
  end_date: string | null
  sort_order: number
  created_at: string
}

export type PortfolioInput = Omit<PortfolioItem, 'id' | 'user_id' | 'created_at'>

export interface Experience {
  id: string
  user_id: string
  company: string
  position: string
  start_date: string | null
  end_date: string | null
  is_current: boolean
  description: string | null
  sort_order: number
  created_at: string
}

export type ExperienceInput = Omit<Experience, 'id' | 'user_id' | 'created_at'>

export interface BusinessCard {
  id: string
  user_id: string
  template_id: string
  name: string
  design_data: Record<string, unknown>
  preview_url: string | null
  created_at: string
  updated_at: string
}

export interface QrCode {
  id: string
  user_id: string
  logo_url: string | null
  style: 'standard' | 'branded'
  color: string
  error_correction: 'L' | 'M' | 'Q' | 'H'
  download_count: number
  created_at: string
}

export type AnalyticsEventType =
  | 'profile_view'
  | 'qr_scan'
  | 'phone_click'
  | 'email_click'
  | 'whatsapp_click'
  | 'website_click'
  | 'social_click'
  | 'save_contact'

export interface AnalyticsEvent {
  id: string
  user_id: string
  event_type: AnalyticsEventType
  source: string | null
  created_at: string
}

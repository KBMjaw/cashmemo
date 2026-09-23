import type { Business, Profile, SocialLink } from '@/types/database'

function escapeVCard(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function buildVCard(
  profile: Profile,
  primaryBusiness: Business | null,
  socialLinks: SocialLink[],
  profileUrl: string,
) {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0']

  const displayName = profile.professional_name || profile.full_name
  lines.push(`FN:${escapeVCard(displayName)}`)
  lines.push(`N:${escapeVCard(profile.full_name)};;;;`)

  if (profile.professional_title) {
    lines.push(`TITLE:${escapeVCard(profile.professional_title)}`)
  }
  if (primaryBusiness) {
    lines.push(`ORG:${escapeVCard(primaryBusiness.name)}`)
  }
  if (profile.show_phone && profile.phone) {
    lines.push(`TEL;TYPE=CELL:${escapeVCard(profile.phone)}`)
  }
  if (profile.show_phone && profile.whatsapp && profile.whatsapp !== profile.phone) {
    lines.push(`TEL;TYPE=WORK:${escapeVCard(profile.whatsapp)}`)
  }
  if (profile.show_email && profile.email) {
    lines.push(`EMAIL:${escapeVCard(profile.email)}`)
  }
  if (profile.website) {
    lines.push(`URL:${escapeVCard(profile.website)}`)
  }
  lines.push(`URL;TYPE=OneTap:${escapeVCard(profileUrl)}`)
  if (profile.show_location && profile.location) {
    lines.push(`ADR;TYPE=WORK:;;${escapeVCard(profile.location)};;;;`)
  }
  if (profile.bio) {
    lines.push(`NOTE:${escapeVCard(profile.bio)}`)
  }
  for (const link of socialLinks) {
    if (link.is_active) {
      lines.push(`X-SOCIALPROFILE;TYPE=${link.platform}:${escapeVCard(link.url)}`)
    }
  }
  lines.push('END:VCARD')
  return lines.join('\r\n')
}

export function downloadVCard(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

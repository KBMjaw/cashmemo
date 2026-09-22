export interface CardTemplate {
  id: string
  name: string
  description: string
  previewBackground: string
  previewText: string
  bg: [string, string]
  textColor: string
  accentColor: string
  mutedColor: string
}

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean whitespace, single accent line.',
    previewBackground: '#ffffff',
    previewText: '#0a1230',
    bg: ['#ffffff', '#ffffff'],
    textColor: '#0a1230',
    accentColor: '#3182f6',
    mutedColor: '#5c73ae',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Structured layout for established businesses.',
    previewBackground: '#0a1230',
    previewText: '#ffffff',
    bg: ['#0a1230', '#121d42'],
    textColor: '#ffffff',
    accentColor: '#59a5ff',
    mutedColor: '#aebbdf',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Bold typography with a geometric accent.',
    previewBackground: '#3182f6',
    previewText: '#ffffff',
    bg: ['#3182f6', '#1c63e0'],
    textColor: '#ffffff',
    accentColor: '#0a1230',
    mutedColor: '#d9ebff',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Elegant serif details for a premium feel.',
    previewBackground: '#1c2b5a',
    previewText: '#f5c869',
    bg: ['#1c2b5a', '#0a1230'],
    textColor: '#f5c869',
    accentColor: '#ffffff',
    mutedColor: '#aebbdf',
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'High-contrast dark theme.',
    previewBackground: '#050a1c',
    previewText: '#59a5ff',
    bg: ['#050a1c', '#0a1230'],
    textColor: '#ffffff',
    accentColor: '#59a5ff',
    mutedColor: '#5c73ae',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Playful shapes for a standout first impression.',
    previewBackground: 'linear-gradient(135deg, #3182f6, #0a1230)',
    previewText: '#ffffff',
    bg: ['#3182f6', '#0a1230'],
    textColor: '#ffffff',
    accentColor: '#f5c869',
    mutedColor: '#d9ebff',
  },
]

export function getTemplate(id: string): CardTemplate {
  return CARD_TEMPLATES.find((t) => t.id === id) ?? CARD_TEMPLATES[0]
}

import { createOwnedCollectionHooks } from '@/hooks/useOwnedCollection'
import type { SocialLink, SocialLinkInput } from '@/types/database'

const hooks = createOwnedCollectionHooks<SocialLink, SocialLinkInput>('social_links', 'social_links')

export const useSocialLinks = hooks.useList
export const useCreateSocialLink = hooks.useCreate
export const useUpdateSocialLink = hooks.useUpdate
export const useDeleteSocialLink = hooks.useDelete
export const useReorderSocialLinks = hooks.useReorder

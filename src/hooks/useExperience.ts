import { createOwnedCollectionHooks } from '@/hooks/useOwnedCollection'
import type { Experience, ExperienceInput } from '@/types/database'

const hooks = createOwnedCollectionHooks<Experience, ExperienceInput>('experience', 'experience')

export const useExperience = hooks.useList
export const useCreateExperience = hooks.useCreate
export const useUpdateExperience = hooks.useUpdate
export const useDeleteExperience = hooks.useDelete
export const useReorderExperience = hooks.useReorder

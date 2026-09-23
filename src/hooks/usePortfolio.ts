import { createOwnedCollectionHooks } from '@/hooks/useOwnedCollection'
import type { PortfolioItem, PortfolioInput } from '@/types/database'

const hooks = createOwnedCollectionHooks<PortfolioItem, PortfolioInput>('portfolio', 'portfolio')

export const usePortfolio = hooks.useList
export const useCreatePortfolioItem = hooks.useCreate
export const useUpdatePortfolioItem = hooks.useUpdate
export const useDeletePortfolioItem = hooks.useDelete
export const useReorderPortfolio = hooks.useReorder

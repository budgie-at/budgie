import type { StatCellAppearance } from '../type/stat-cell-appearance.type';

export const STAT_CELL_APPEARANCE_CLASS_NAME: Record<
    StatCellAppearance,
    { readonly container: readonly string[]; readonly value: readonly string[] }
> = {
    centered: {
        container: ['flex-1', 'items-center', 'gap-y-xs', 'px-sm'],
        value: ['text-md', 'font-semibold', 'tabular-nums']
    },
    editorial: {
        container: ['flex-1', 'items-start', 'gap-y-xs', 'pl-lg', 'pr-sm'],
        value: ['text-xl', 'font-semibold', 'tabular-nums']
    }
};

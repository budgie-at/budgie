import type { StatCellAppearance } from '../type/stat-cell-appearance.type';

const EDITORIAL_VALUE = ['text-xl', 'font-semibold', 'tabular-nums'];

export const STAT_CELL_APPEARANCE_CLASS_NAME: Record<
    StatCellAppearance,
    { readonly container: readonly string[]; readonly value: readonly string[] }
> = {
    centered: {
        container: ['flex-1', 'items-center', 'gap-y-xs', 'px-sm'],
        value: ['text-md', 'font-semibold', 'tabular-nums']
    },
    editorial: {
        container: ['flex-1', 'items-start', 'gap-y-xs', 'py-2xl', 'px-lg'],
        value: EDITORIAL_VALUE
    },
    'editorial-leading': {
        container: ['flex-1', 'items-start', 'gap-y-xs', 'py-2xl', 'pl-0', 'pr-lg'],
        value: EDITORIAL_VALUE
    }
};

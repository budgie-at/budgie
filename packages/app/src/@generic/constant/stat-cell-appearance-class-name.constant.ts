import type { StatCellAppearance } from '../type/stat-cell-appearance.type';

export const STAT_CELL_APPEARANCE_CLASS_NAME: Record<
    StatCellAppearance,
    { readonly container: readonly string[]; readonly label: readonly string[]; readonly value: readonly string[] }
> = {
    centered: {
        container: ['flex-1', 'items-center', 'gap-y-xs', 'px-sm'],
        label: ['shrink', 'text-xxs', 'uppercase', 'tracking-wider', 'text-secondary-foreground'],
        value: ['text-md', 'font-semibold', 'tabular-nums']
    },
    editorial: {
        container: ['flex-1', 'items-start', 'gap-y-xs', 'py-2xl'],
        label: ['shrink', 'text-xs', 'font-medium', 'text-secondary-foreground'],
        value: ['text-2xl', 'font-semibold', 'tabular-nums']
    }
};

import { CategorizeInboxSectionEnum } from '@budgie/categorization';

export const CATEGORIZE_INBOX_SECTION_ORDER = [
    CategorizeInboxSectionEnum.CONFIDENT,
    CategorizeInboxSectionEnum.CASH_WITHDRAWALS,
    CategorizeInboxSectionEnum.REVIEW,
    CategorizeInboxSectionEnum.ONE_OFFS
] as const;

export const CATEGORIZE_INBOX_SECTION_COLOR: Record<CategorizeInboxSectionEnum, string> = {
    [CategorizeInboxSectionEnum.CONFIDENT]: 'bg-positive-fill',
    [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: 'bg-warning-fill',
    [CategorizeInboxSectionEnum.REVIEW]: 'bg-secondary-foreground',
    [CategorizeInboxSectionEnum.ONE_OFFS]: 'bg-secondary-foreground/40'
};

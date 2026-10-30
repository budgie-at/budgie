import { CategorizeInboxSectionEnum } from '@budgie/categorization';

export const CATEGORIZE_INBOX_SECTION_ORDER = [
    CategorizeInboxSectionEnum.CONFIDENT,
    CategorizeInboxSectionEnum.CASH_WITHDRAWALS,
    CategorizeInboxSectionEnum.REVIEW,
    CategorizeInboxSectionEnum.ONE_OFFS
] as const;

export const CATEGORIZE_INBOX_SECTION_CLASS_NAME: Record<CategorizeInboxSectionEnum, readonly string[]> = {
    [CategorizeInboxSectionEnum.CONFIDENT]: ['bg-positive-action'],
    [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: ['bg-attention-foreground'],
    [CategorizeInboxSectionEnum.REVIEW]: ['bg-secondary-foreground'],
    [CategorizeInboxSectionEnum.ONE_OFFS]: ['border-[1.5px]', 'border-secondary-foreground']
};

export const CATEGORIZE_INBOX_SORTED_CLASS_NAME: readonly string[] = ['bg-primary'];

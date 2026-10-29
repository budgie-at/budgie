import { CategorizeInboxSectionEnum } from '@budgie/categorization';

export const CATEGORIZE_INBOX_SECTION_ACCENT: Record<CategorizeInboxSectionEnum, string> = {
    [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: 'bg-warning-fill',
    [CategorizeInboxSectionEnum.CONFIDENT]: 'bg-positive-fill',
    [CategorizeInboxSectionEnum.REVIEW]: 'bg-cta-background',
    [CategorizeInboxSectionEnum.ONE_OFFS]: 'bg-secondary-foreground'
};

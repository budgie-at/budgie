const COMPACT_FORM_HEIGHT = 700;

export const isCompactTransactionForm = (fontScale: number, height: number) => height < COMPACT_FORM_HEIGHT && fontScale <= 1;

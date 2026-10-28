import type { MetaPillVariant } from '../../@generic/type/meta-pill-variant.type';

export type BudgetPaceVariant = Exclude<MetaPillVariant, 'default'>;

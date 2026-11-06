import type { RecurringSeriesKindEnum } from '@budgie/contracts';
export const chargeKey = (kind: RecurringSeriesKindEnum, transactionId: number): string => `${kind}:${transactionId}`;

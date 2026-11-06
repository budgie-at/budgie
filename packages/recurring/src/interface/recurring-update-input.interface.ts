import type { RecurringManualInputInterface } from './recurring-manual-input.interface';

export type RecurringUpdateInputInterface = Partial<Omit<RecurringManualInputInterface, 'kind'>>;

import type { AccountEntityInterface } from '@budgie/contracts';

export type DebtSettlementAccountInterface = Pick<AccountEntityInterface, 'title' | 'debtType'>;

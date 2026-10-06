import type { AccountCreateEntityInterface, DebtAccountCreateInputInterface } from '@budgie/contracts';

export type DebtAccountUpdateInputInterface = Partial<
    DebtAccountCreateInputInterface & Pick<AccountCreateEntityInterface, 'installmentCount'>
>;

import { AccountDebtTypeEnum, AccountTypeEnum } from '@budgie/contracts';

import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface AccountSelectorModalParams {
    readonly initialAccountId?: number | null;
    readonly debtType?: AccountDebtTypeEnum;
    readonly excludeAccountId?: number | null;
    readonly excludeAccountTypes?: AccountTypeEnum[];
    readonly includeAccountTypes?: AccountTypeEnum[];
    readonly emptyStateDescription?: string;
    readonly onlyActive?: boolean;
    readonly showDebtTotal?: boolean;
}

export type AccountSelectorResult = number | null;

export const [AccountSelectorModalContext, useAccountSelectorModal] = createModalContext<AccountSelectorModalParams, AccountSelectorResult>(
    null
);

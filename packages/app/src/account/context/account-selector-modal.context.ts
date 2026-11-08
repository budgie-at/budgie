import { AccountDebtTypeEnum, AccountTypeEnum } from '@budgie/contracts';

import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

import type { AnchoredMorphOriginInterface } from '../../@generic/interface/anchored-morph-origin.interface';
import type { AccountSelectorCreateActionInterface } from '../interface/account-selector-create-action.interface';

export interface AccountSelectorModalParams {
    readonly initialAccountId?: number | null;
    readonly debtType?: AccountDebtTypeEnum;
    readonly excludeAccountId?: number | null;
    readonly excludeAccountTypes?: AccountTypeEnum[];
    readonly includeAccountTypes?: AccountTypeEnum[];
    readonly emptyStateDescription?: string;
    readonly onlyActive?: boolean;
    readonly showDebtTotal?: boolean;
    readonly createAction?: AccountSelectorCreateActionInterface;
    readonly origin?: AnchoredMorphOriginInterface;
}

export type AccountSelectorResult = number | null;

export const [AccountSelectorModalContext, useAccountSelectorModal, useAccountSelectorModalParams] = createModalContext<
    AccountSelectorModalParams,
    AccountSelectorResult
>(null);

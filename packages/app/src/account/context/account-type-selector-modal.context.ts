import { AccountTypeEnum } from '@budgie/contracts';

import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface AccountTypeSelectorModalParams {
    readonly currentType: AccountTypeEnum;
}

export type AccountTypeSelectorResult = AccountTypeEnum | null;

export const [AccountTypeSelectorModalContext, useAccountTypeSelectorModal] = createModalContext<
    AccountTypeSelectorModalParams,
    AccountTypeSelectorResult
>(null);

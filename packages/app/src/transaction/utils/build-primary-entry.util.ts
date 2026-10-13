import { TransactionEntryCreateInputInterface, TransactionEntryKindEnum, TransactionEntryTypeEnum } from '@budgie/contracts';

import type { QuickFormBuildEntryParamsInterface } from '../interface/quick-form-build-entry-params.interface';

export const buildPrimaryEntry = (
    type: TransactionEntryTypeEnum,
    { accountId, categoryId, amount, mccCategoryId }: QuickFormBuildEntryParamsInterface
): TransactionEntryCreateInputInterface[] => [
    {
        accountId,
        categoryId,
        amount,
        type,
        kind: TransactionEntryKindEnum.PRIMARY,
        mccCategoryId,
        externalId: null
    }
];

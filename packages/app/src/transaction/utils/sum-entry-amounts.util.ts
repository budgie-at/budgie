import { TransactionEntryTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

interface EntryWithAmount {
    readonly amount: number;
    readonly type: TransactionEntryTypeEnum;
}

export const sumEntryAmounts = (entries: EntryWithAmount[], type?: TransactionEntryTypeEnum): number =>
    entries.reduce((sum, entry) => (isDefined(type) && entry.type !== type ? sum : sum + entry.amount), 0);

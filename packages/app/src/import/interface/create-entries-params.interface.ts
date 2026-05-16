import { TransactionTypeEnum } from '@budgie/contracts';

import { EntryParamsInterface } from './entry-params.interface';

export interface CreateEntriesParamsInterface {
    readonly type: TransactionTypeEnum;
    readonly categoryId: number;
    readonly source: EntryParamsInterface;
    readonly dest: EntryParamsInterface | null;
    readonly externalId?: string;
    readonly mccCategoryId: number | null;
}

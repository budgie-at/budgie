import { CategoryEntityInterface, TransactionTypeEnum } from '@budgie/contracts';

import { EntryParamsInterface } from './entry-params.interface';

export interface CreateEntriesParamsInterface {
    type: TransactionTypeEnum;
    category: CategoryEntityInterface;
    source: EntryParamsInterface;
    dest: EntryParamsInterface | null;
    externalId?: string;
}

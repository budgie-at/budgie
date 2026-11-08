import type { EntryWithLocalIdInterface } from '../utils/entry-with-local-id.util';
import type { TransactionEntryTypeEnum } from '@budgie/contracts';
import type { Dispatch, SetStateAction } from 'react';

export interface SplitEntriesEditorConfigInterface {
    readonly entries: EntryWithLocalIdInterface[];
    readonly isInitiallySplit: boolean;
    readonly entryType: TransactionEntryTypeEnum;
    readonly totalAmount: number;
    readonly onEntriesChange: Dispatch<SetStateAction<EntryWithLocalIdInterface[]>>;
}

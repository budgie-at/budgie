import { RefreshedImportedEntriesStatusEnum } from '../type/refreshed-imported-entries-status.enum';

export interface ImportedEntryMatchInterface {
    readonly status: RefreshedImportedEntriesStatusEnum;
    readonly matchingInputIndex: number | null;
}

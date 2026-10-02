import { RefreshedImportedEntriesStatusEnum } from '../enum/refreshed-imported-entries-status.enum';

export interface ImportedEntryMatchInterface {
    readonly status: RefreshedImportedEntriesStatusEnum;
    readonly matchingInputIndex: number | null;
}

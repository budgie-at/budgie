import { BaseFileBankSyncService } from '@app/sync/service/base-file-bank-sync.service';

import type { FileBasedBankSyncClientInterface } from '@app/sync/interface/file-based-bank-sync-client.interface';
import type { ParsedFileResultInterface } from '@app/sync/interface/parsed-file-result.interface';
import type { ExternalSourceEnum, MccCategoryLookupInterface } from '@budgie/contracts';

export class StubFileBankSyncService extends BaseFileBankSyncService {
    private static readonly EMPTY_MCC_CATEGORY_ID_MAP = new Map<string, MccCategoryLookupInterface | null>();

    constructor(
        externalSource: ExternalSourceEnum,
        private readonly client: FileBasedBankSyncClientInterface,
        private readonly mccCategoryIdMap: Map<
            string,
            MccCategoryLookupInterface | null
        > = StubFileBankSyncService.EMPTY_MCC_CATEGORY_ID_MAP
    ) {
        super(externalSource);
    }

    protected parseFile(): Promise<ParsedFileResultInterface> {
        return Promise.resolve({ client: this.client, bankAccounts: this.client.getAccounts() });
    }

    protected resolveMccCategoryIdMap(): Promise<Map<string, MccCategoryLookupInterface | null>> {
        return Promise.resolve(this.mccCategoryIdMap);
    }
}

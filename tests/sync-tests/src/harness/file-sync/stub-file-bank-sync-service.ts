import { AccountTypeEnum } from '@budgie/contracts';

import { AbstractFileSyncService } from '@app/sync/service/abstract-file-sync.service';

import type { FileBasedSyncClientInterface } from '@app/sync/interface/file-based-sync-client.interface';
import type { ParsedFileResultInterface } from '@app/sync/interface/parsed-file-result.interface';
import type { ExternalSourceEnum, MccCategoryLookupInterface } from '@budgie/contracts';

export class StubFileBankSyncService extends AbstractFileSyncService {
    private static readonly EMPTY_MCC_CATEGORY_ID_MAP = new Map<string, MccCategoryLookupInterface | null>();

    protected readonly provider: ExternalSourceEnum;
    protected readonly providerTitle: string;
    protected readonly accountType = AccountTypeEnum.BANK_SYNC;

    constructor(
        externalSource: ExternalSourceEnum,
        private readonly client: FileBasedSyncClientInterface,
        private readonly mccCategoryIdMap: Map<
            string,
            MccCategoryLookupInterface | null
        > = StubFileBankSyncService.EMPTY_MCC_CATEGORY_ID_MAP
    ) {
        super();
        this.provider = externalSource;
        this.providerTitle = externalSource.charAt(0) + externalSource.slice(1).toLowerCase();
    }

    protected parseFile(): Promise<ParsedFileResultInterface> {
        return Promise.resolve({ client: this.client, bankAccounts: this.client.getAccounts() });
    }

    protected resolveMccCategoryIdMap(): Promise<Map<string, MccCategoryLookupInterface | null>> {
        return Promise.resolve(this.mccCategoryIdMap);
    }
}

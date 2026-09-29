import { AbstractFileSyncService } from '@app/sync/service/abstract-file-sync.service';
import { AccountTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import type { FileBasedSyncClientInterface } from '@app/sync/interface/file-based-sync-client.interface';
import type { ParsedFileResultInterface } from '@app/sync/interface/parsed-file-result.interface';
import type { ExternalSourceEnum, MccCategoryLookupInterface } from '@budgie/contracts';

export class StubFileBankSyncService extends AbstractFileSyncService {
    private static readonly EMPTY_MCC_CATEGORY_ID_MAP = new Map<string, MccCategoryLookupInterface | null>();

    protected readonly providerTitle = 'Stub';

    protected readonly accountType = AccountTypeEnum.BANK_SYNC;

    constructor(
        protected readonly provider: ExternalSourceEnum,
        private readonly client: FileBasedSyncClientInterface,
        private readonly mccCategoryIdMap: Map<
            string,
            MccCategoryLookupInterface | null
        > = StubFileBankSyncService.EMPTY_MCC_CATEGORY_ID_MAP
    ) {
        super();
    }

    protected readonly parseFile = (): Effect.Effect<ParsedFileResultInterface> =>
        Effect.succeed({ client: this.client, bankAccounts: this.client.getAccounts() });

    protected readonly resolveMccCategoryIdMap = (): Effect.Effect<Map<string, MccCategoryLookupInterface | null>> =>
        Effect.succeed(this.mccCategoryIdMap);
}

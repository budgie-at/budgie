import { generateDefaultSyncAccountTitle } from '@app/sync/util/generate-default-sync-account-title.util';
import { makeFileSyncService } from '@app/sync/util/make-file-sync-service.util';
import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import type { FileBasedSyncClientInterface } from '@app/sync/interface/file-based-sync-client.interface';
import type { FileSyncServiceDefinitionInterface } from '@app/sync/interface/file-sync-service-definition.interface';
import type { ExternalSourceEnum, MccCategoryLookupInterface } from '@budgie/contracts';

export const makeStubFileBankSyncService = (
    provider: ExternalSourceEnum,
    client: FileBasedSyncClientInterface,
    mccCategoryIdMap: Map<string, MccCategoryLookupInterface | null> = new Map(),
    overrides: Partial<Pick<FileSyncServiceDefinitionInterface, 'parseFile' | 'resolveMccCategoryIdMap'>> = {}
) =>
    makeFileSyncService({
        provider,
        accountType: AccountTypeEnum.BANK_SYNC,
        generateAccountTitle: account => generateDefaultSyncAccountTitle('Stub', account),
        accountIcon: () => UserIconNameEnum.Landmark,
        parseFile: () => Effect.succeed({ client, bankAccounts: client.getAccounts() }),
        resolveMccCategoryIdMap: () => Effect.succeed(mccCategoryIdMap),
        ...overrides
    });

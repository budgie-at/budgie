import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { generateDefaultSyncAccountTitle, makeFileSyncService } from '@budgie/sync';
import * as Effect from 'effect/Effect';

import type { ExternalSourceEnum, MccCategoryLookupInterface } from '@budgie/contracts';
import type { FileBasedSyncClientInterface, FileSyncServiceDefinitionInterface } from '@budgie/sync';

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

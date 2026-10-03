import { AccountTypeEnum, ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

import { generateDefaultSyncAccountTitle } from '../../core/util/generate-default-sync-account-title.util';

import type { SyncServiceDefinitionInterface } from '../../core/interface/sync-service-definition.interface';

export const BINANCE_ACCOUNT_DEFINITION: SyncServiceDefinitionInterface = {
    provider: ExternalSourceEnum.BINANCE,
    accountType: AccountTypeEnum.CRYPTO_SYNC,
    generateAccountTitle: account =>
        isNotEmptyString(account.title) ? account.title : generateDefaultSyncAccountTitle('Binance', account),
    accountIcon: () => UserIconNameEnum.Bitcoin
};

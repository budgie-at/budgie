import {
    ConsolidationCoordinatorService,
    ConsolidationExecutorService,
    ConsolidationRepairExecutorService,
    P2pFiatDirectionEnum
} from '@budgie/consolidation';
import { i18n } from '@lingui/core';

import {
    atmCashWithdrawalRepository,
    existingTransferRepository,
    ibanBridgeTransferRepository,
    refundPairRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository,
    transferPairRepository
} from '../../@generic/drizzle/db/db';

const consolidationExecutorDependencies = {
    resolveP2pTransferTitle: (direction: P2pFiatDirectionEnum, assetCode: string): string =>
        direction === P2pFiatDirectionEnum.BUY
            ? i18n._('Binance P2P buy {assetCode}', { assetCode })
            : i18n._('Binance P2P sell {assetCode}', { assetCode }),
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
};

const consolidationExecutorService = new ConsolidationExecutorService(consolidationExecutorDependencies);

const consolidationRepairExecutorService = new ConsolidationRepairExecutorService(consolidationExecutorDependencies);

export const consolidationCoordinatorService = new ConsolidationCoordinatorService(
    {
        atmCashWithdrawalRepository,
        existingTransferRepository,
        ibanBridgeTransferRepository,
        refundPairRepository,
        transferPairRepository
    },
    consolidationExecutorService,
    consolidationRepairExecutorService
);

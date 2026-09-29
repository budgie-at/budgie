import {
    ConsolidationCoordinatorService,
    ConsolidationExecutorService,
    ConsolidationRepairExecutorService,
    P2pFiatDirectionEnum
} from '@budgie/consolidation';
import { transactionAsync } from '@budgie/contracts';
import { i18n } from '@lingui/core';

import {
    atmCashWithdrawalRepository,
    db,
    existingTransferRepository,
    ibanBridgeTransferRepository,
    refundPairRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository,
    transferPairRepository
} from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';

const consolidationExecutorDependencies = {
    database: db,
    resolveP2pTransferTitle: (direction: P2pFiatDirectionEnum, assetCode: string): string =>
        direction === P2pFiatDirectionEnum.BUY
            ? i18n._('Binance P2P buy {assetCode}', { assetCode })
            : i18n._('Binance P2P sell {assetCode}', { assetCode }),
    runTransaction: transactionAsync,
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
    consolidationRepairExecutorService,
    microPause
);

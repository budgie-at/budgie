import { AccountRepository, SyncModeEnum, SyncRepository, SyncStatusEnum } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { subMonths } from 'date-fns/subMonths';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { SyncHistoryDepthEnum } from '../enum/sync-history-depth.enum';
import { SyncIntegrationTokenService } from '../service/sync-integration-token.service';

import type { ExternalSourceEnum } from '@budgie/contracts';

export const makePollingSyncAccountSetup = Effect.fnUntraced(function* (provider: ExternalSourceEnum) {
    const accountRepository = yield* AccountRepository;
    const syncRepository = yield* SyncRepository;
    const transactionService = yield* TransactionService;
    const syncIntegrationTokenService = yield* SyncIntegrationTokenService;
    const backwardSyncLimitMonths: Record<SyncHistoryDepthEnum, number | null> = {
        [SyncHistoryDepthEnum.MONTH_1]: 1,
        [SyncHistoryDepthEnum.MONTHS_3]: 3,
        [SyncHistoryDepthEnum.MONTHS_6]: 6,
        [SyncHistoryDepthEnum.YEAR_1]: 12,
        [SyncHistoryDepthEnum.FULL]: null,
        [SyncHistoryDepthEnum.NEW_ONLY]: 0
    };

    return Effect.fnUntraced(function* (
        accountId: number,
        token: string,
        historyDepth: SyncHistoryDepthEnum = SyncHistoryDepthEnum.FULL,
        setupBalance: number | null = null
    ) {
        const now = new Date();
        const months = backwardSyncLimitMonths[historyDepth];
        const backwardSyncLimitAt = isDefined(months) ? subMonths(now, months) : null;
        const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);
        yield* accountRepository.updateById(accountId, { integrationId: integration.id });

        const existingSync = yield* syncRepository.getByAccountId(accountId);
        if (isDefined(existingSync)) {
            yield* syncRepository.update(existingSync.id, { enabled: true, errorCount: 0, lastError: null, backwardSyncLimitAt });

            return;
        }

        const earliestTransactionTime = yield* transactionService.getEarliestTransactionTimeByAccountId(accountId);
        yield* syncRepository.create({
            accountId,
            provider,
            enabled: true,
            mode: SyncModeEnum.BACKWARD,
            status: SyncStatusEnum.SYNCING,
            backwardSyncFromAt: now,
            backwardSyncedAt: earliestTransactionTime ?? null,
            backwardSyncLimitAt,
            forwardSyncFromAt: now,
            forwardSyncedAt: null,
            setupBalance
        });
    });
});

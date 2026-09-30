import { UnconsolidationService } from '@budgie/consolidation';
import {
    AccountRepository,
    DebtEventRepository,
    Db,
    SettingsRepository,
    TransactionEntryRepository,
    TransactionRepository,
    TransactionConsolidationRepository
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { YIELD_TO_UI } from '../../@generic/constant/yield-to-ui.constant';
import { Workload } from '../../@generic/service/workload.service';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';

import { AccountBalanceIncrementalService } from './account-balance-incremental.service';
import { AccountTransferConversionService } from './account-transfer-conversion.service';

export class AccountArchiveService extends Context.Service<AccountArchiveService>()('@budgie/app/AccountArchiveService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const debtEventRepository = yield* DebtEventRepository;
        const settingsRepository = yield* SettingsRepository;
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionConsolidationRepository = yield* TransactionConsolidationRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const accountTransferConversionService = yield* AccountTransferConversionService;
        const unconsolidationService = yield* UnconsolidationService;
        const workload = yield* Workload;
        const unconsolidationBatchSize = 25;

        const unconsolidateActiveAutoByAccountId = Effect.fn('AccountArchiveService.unconsolidateActiveAutoByAccountId')(function* (
            id: number
        ) {
            const canonicals = yield* transactionConsolidationRepository.findActiveAutoConsolidatedByAccountIds([id]);

            yield* processInputWithBatches(canonicals, unconsolidationBatchSize, batch =>
                Effect.forEach(batch, canonical => Db.transaction(unconsolidationService.unconsolidateById(canonical.id)), {
                    discard: true
                }).pipe(Effect.as(null))
            );
        });

        const archiveByIdInTransaction = Effect.fn('AccountArchiveService.archiveByIdInTransaction')(function* (id: number) {
            yield* unconsolidateActiveAutoByAccountId(id);

            yield* accountRepository.archiveById(id);
            yield* debtEventRepository.archiveByAccountIds([id]);
            yield* transactionEntryRepository.archiveByAccountIds([id]);
            yield* transactionRepository.archiveByAccountIds([id]);

            const settings = yield* settingsRepository.getSettings();
            if (settings.defaultAccountId === id) {
                yield* settingsRepository.update({ defaultAccountId: null });
            }
        });

        return {
            archiveById: Effect.fn('AccountArchiveService.archiveById')(function* (id: number) {
                yield* YIELD_TO_UI;

                yield* workload.runForeground(Db.transaction(archiveByIdInTransaction(id)));
            }),
            restoreById: Effect.fn('AccountArchiveService.restoreById')(function* (id: number) {
                yield* YIELD_TO_UI;

                yield* Db.transaction(
                    Effect.gen(function* () {
                        yield* accountRepository.restoreById(id);
                        yield* debtEventRepository.restoreByAccountIds([id]);
                        yield* transactionEntryRepository.restoreByAccountIds([id]);
                        yield* transactionRepository.restoreByAccountIds([id]);
                    })
                );
            }),
            deleteById: Effect.fn('AccountArchiveService.deleteById')(
                function* (id: number) {
                    yield* unconsolidateActiveAutoByAccountId(id);
                    yield* accountTransferConversionService.convertAccountTransfers(id);
                    yield* debtEventRepository.deleteByAccountId(id);
                    yield* transactionEntryRepository.deleteByAccountId(id);
                    yield* transactionRepository.deleteByAccountId(id);

                    const settings = yield* settingsRepository.getSettings();
                    if (settings.defaultAccountId === id) {
                        yield* settingsRepository.update({ defaultAccountId: null });
                    }

                    yield* accountRepository.deleteById(id);
                    yield* accountBalanceIncrementalService.updateAllBalances(true);
                },
                effect => Db.transaction(effect)
            ),
            archiveByIdInTransaction
        };
    })
}) {
    static readonly layer = Layer.effect(AccountArchiveService, AccountArchiveService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            DebtEventRepository.layer,
            SettingsRepository.layer,
            TransactionEntryRepository.layer,
            TransactionRepository.layer,
            TransactionConsolidationRepository.layer,
            AccountBalanceIncrementalService.layer,
            AccountTransferConversionService.layer,
            UnconsolidationService.layer,
            Workload.layer
        ])
    );
}

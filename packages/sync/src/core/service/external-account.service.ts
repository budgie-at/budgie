import { AccountRepository, Db, TransactionRepository } from '@budgie/contracts';
import { AccountArchiveService, AccountTransferConversionService } from '@budgie/ledger';
import { RuleEngineService } from '@budgie/rules';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

export class ExternalAccountService extends Context.Service<ExternalAccountService>()('@budgie/sync/ExternalAccountService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const transactionRepository = yield* TransactionRepository;
        const accountArchiveService = yield* AccountArchiveService;
        const accountTransferConversionService = yield* AccountTransferConversionService;
        const ruleEngineService = yield* RuleEngineService;

        return {
            markExternal: Effect.fn('ExternalAccountService.markExternal')(function* (accountId: number) {
                yield* ruleEngineService.applyRulesToTransactionIds(yield* accountArchiveService.markExternalById(accountId));
            }),
            countCandidates: Effect.fn('ExternalAccountService.countCandidates')(function* () {
                const accounts = yield* accountRepository.findExternal();
                const transfers = yield* Effect.forEach(accounts, account => transactionRepository.findTransfersForConversion(account.id));

                return transfers.flat().length;
            }),
            repair: Effect.fn('ExternalAccountService.repair')(function* () {
                const accounts = yield* accountRepository.findExternal();
                const convertedTransactionIds = yield* Db.transaction(
                    Effect.forEach(accounts, account => accountTransferConversionService.convertAccountTransfers(account.id, null))
                );

                yield* ruleEngineService.applyRulesToTransactionIds(convertedTransactionIds.flat());

                return convertedTransactionIds.flat().length;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(ExternalAccountService, ExternalAccountService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            TransactionRepository.layer,
            AccountArchiveService.layer,
            AccountTransferConversionService.layer,
            RuleEngineService.layer
        ])
    );
}

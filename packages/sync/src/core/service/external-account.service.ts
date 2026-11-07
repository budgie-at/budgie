import { AccountRepository, AccountTypeEnum, AccountNatureEnum, UserIconNameEnum, Db, TransactionRepository } from '@budgie/contracts';
import { AccountArchiveService, AccountTransferConversionService } from '@budgie/ledger';
import { RuleEngineService } from '@budgie/rules';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { OwnTransferRepository } from '../repository/own-transfer.repository';

export class ExternalAccountService extends Context.Service<ExternalAccountService>()('@budgie/sync/ExternalAccountService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const ownTransferRepository = yield* OwnTransferRepository;
        const untrackedOwnExternalId = 'untracked-own-account';
        const transactionRepository = yield* TransactionRepository;
        const accountArchiveService = yield* AccountArchiveService;
        const accountTransferConversionService = yield* AccountTransferConversionService;
        const ruleEngineService = yield* RuleEngineService;

        return {
            getUntrackedOwnAccount: Effect.fn('ExternalAccountService.getUntrackedOwnAccount')(function* (instrumentId: number) {
                const existing = yield* ownTransferRepository.findUntrackedOwnAccount(instrumentId, untrackedOwnExternalId);

                if (isDefined(existing)) {
                    return existing;
                }

                return yield* accountRepository.create({
                    title: 'Untracked own account',
                    externalId: untrackedOwnExternalId,
                    instrumentId,
                    type: AccountTypeEnum.BANK,
                    nature: AccountNatureEnum.ASSET,
                    icon: UserIconNameEnum.Wallet,
                    order: 0,
                    includeInNetWorth: false,
                    isActive: false
                });
            }),
            markExternal: Effect.fn('ExternalAccountService.markExternal')(function* (accountId: number) {
                const archivedTransactionIds = yield* accountArchiveService.markExternalById(accountId);
                yield* ruleEngineService.applyRulesToTransactionIds(archivedTransactionIds);
            }),
            countCandidates: Effect.fn('ExternalAccountService.countCandidates')(function* () {
                const accounts = yield* accountRepository.findExternal;
                const transfers = yield* Effect.forEach(accounts, account => transactionRepository.findTransfersForConversion(account.id));

                return transfers.flat().length;
            }),
            repair: Effect.fn('ExternalAccountService.repair')(function* () {
                const accounts = yield* accountRepository.findExternal;
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
            OwnTransferRepository.layer,
            AccountRepository.layer,
            TransactionRepository.layer,
            AccountArchiveService.layer,
            AccountTransferConversionService.layer,
            RuleEngineService.layer
        ])
    );
}

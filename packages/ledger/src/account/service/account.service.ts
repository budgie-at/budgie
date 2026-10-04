import {
    AccountBalanceRepository,
    AccountNatureEnum,
    AccountNotFoundError,
    AccountRepository,
    Db,
    SettingsRepository
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNumber, isPositiveNumber } from '@rnw-community/shared';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micro-units.util';
import { processInputWithBatches } from '../../@generic/util/process-input-with-batches.util';
import { TransactionService } from '../../transaction/service/transaction.service';

import type { AccountEntityInterface, DepositAccountCreateInputInterface, LiabilityAccountCreateInputInterface } from '@budgie/contracts';

export class AccountService extends Context.Service<AccountService>()('@budgie/ledger/AccountService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const settingsRepository = yield* SettingsRepository;
        const transactionService = yield* TransactionService;

        const adjustBalanceTo = Effect.fn('AccountService.adjustBalanceTo')(function* (
            accountId: number,
            targetBalance: number,
            operatedAt: Date = new Date()
        ) {
            const result = yield* accountBalanceRepository.getByAccountId(accountId);
            const targetBalanceMicro = convertToMicroUnits(targetBalance);
            const delta = targetBalanceMicro - (result.at(0)?.balance ?? 0);

            if (delta === 0) {
                return;
            }

            yield* transactionService.createBalanceAdjustment(accountId, delta, operatedAt);

            yield* accountBalanceRepository.upsert({ accountId, amount: targetBalanceMicro });
        });

        const createAccountRecord = Effect.fn('AccountService.createAccountRecord')(function* (
            input: Omit<LiabilityAccountCreateInputInterface, 'currentBalance'> & Record<string, unknown>,
            count: number,
            nature: AccountNatureEnum = AccountNatureEnum.LIABILITY
        ) {
            return yield* accountRepository.create({ ...input, order: count + 1, nature });
        });

        const processBatch = Effect.fn('AccountService.processBatch')(
            function* (batch: LiabilityAccountCreateInputInterface[]) {
                const [{ count }] = yield* accountRepository.count();
                const accounts = yield* accountRepository.bulkCreate(
                    batch.map((input, index) => ({ ...input, order: count + index + 1, nature: AccountNatureEnum.LIABILITY }))
                );

                yield* Effect.all(
                    accounts.map((account, index) => adjustBalanceTo(account.id, batch[index].currentBalance)),
                    { concurrency: 'unbounded' }
                );

                return accounts;
            },
            effect => Db.transaction(effect)
        );

        return {
            create: Effect.fn('AccountService.create')(
                function* (input: LiabilityAccountCreateInputInterface) {
                    const [{ count }] = yield* accountRepository.count();
                    const createdAccount = yield* createAccountRecord({ ...input }, count);

                    yield* adjustBalanceTo(createdAccount.id, input.currentBalance);

                    if (!isPositiveNumber(count)) {
                        yield* settingsRepository.update({ defaultAccountId: createdAccount.id });
                    }

                    return createdAccount;
                },
                effect => Db.transaction(effect)
            ),
            createDeposit: Effect.fn('AccountService.createDeposit')(
                function* (input: DepositAccountCreateInputInterface) {
                    const [{ count }] = yield* accountRepository.count();
                    const createdAccount = yield* createAccountRecord(input, count, AccountNatureEnum.ASSET);

                    yield* adjustBalanceTo(createdAccount.id, input.currentBalance);

                    return createdAccount;
                },
                effect => Db.transaction(effect)
            ),
            updateById: Effect.fn('AccountService.updateById')(
                function* (id: number, input: Partial<Omit<LiabilityAccountCreateInputInterface, 'type'>>) {
                    const updatedAccount = yield* accountRepository.updateById(id, input);

                    if (isNumber(input.currentBalance)) {
                        yield* adjustBalanceTo(updatedAccount.id, input.currentBalance);
                    }

                    return updatedAccount;
                },
                effect => Db.transaction(effect)
            ),
            updateDepositById: Effect.fn('AccountService.updateDepositById')(
                function* (
                    id: number,
                    input: Partial<
                        Pick<
                            DepositAccountCreateInputInterface,
                            'title' | 'icon' | 'currentBalance' | 'interestRate' | 'deadline' | 'includeInNetWorth' | 'isActive'
                        >
                    >
                ) {
                    const { currentBalance, ...accountInput } = input;
                    const updatedAccount = yield* accountRepository.updateById(id, accountInput);

                    if (isNumber(currentBalance)) {
                        yield* adjustBalanceTo(updatedAccount.id, currentBalance);
                    }

                    return updatedAccount;
                },
                effect => Db.transaction(effect)
            ),
            activateById: Effect.fn('AccountService.activateById')(
                function* (id: number) {
                    yield* accountRepository.updateById(id, { isActive: true });
                },
                effect => Db.transaction(effect)
            ),
            bulkCreate: Effect.fn('AccountService.bulkCreate')(function* (
                inputs: LiabilityAccountCreateInputInterface[],
                batchSize: number = 100
            ) {
                const result = yield* processInputWithBatches(inputs, batchSize, batch => processBatch(batch));

                return result.reduce<Record<string, AccountEntityInterface>>((acc, account) => {
                    acc[account.title] = account;

                    return acc;
                }, {});
            }),
            findByIdOrFail: Effect.fn('AccountService.findByIdOrFail')(function* (id: number) {
                const account = yield* accountRepository.findById(id);

                if (!isDefined(account)) {
                    return yield* new AccountNotFoundError({ id });
                }

                return account;
            }),
            findByIdIncludingArchivedOrFail: Effect.fn('AccountService.findByIdIncludingArchivedOrFail')(function* (id: number) {
                const account = yield* accountRepository.findByIdIncludingArchived(id);

                if (!isDefined(account)) {
                    return yield* new AccountNotFoundError({ id });
                }

                return account;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(AccountService, AccountService.make).pipe(
        Layer.provide([AccountRepository.layer, AccountBalanceRepository.layer, SettingsRepository.layer, TransactionService.layer])
    );
}

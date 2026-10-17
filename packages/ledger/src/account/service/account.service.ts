import {
    AccountBalanceRepository,
    AccountNatureEnum,
    AccountNotFoundError,
    AccountRepository,
    Db,
    SettingsRepository,
    convertToMicroUnits
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNumber } from '@rnw-community/shared';

import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { TransactionService } from '../../transaction/service/transaction.service';

import type {
    AccountEntityInterface,
    DbError,
    DepositAccountCreateInputInterface,
    LiabilityAccountCreateInputInterface
} from '@budgie/contracts';

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

        const createWithBalance = Effect.fn('AccountService.createWithBalance')(
            function* (
                { currentBalance, ...input }: LiabilityAccountCreateInputInterface | DepositAccountCreateInputInterface,
                nature: AccountNatureEnum
            ) {
                const [{ count }] = yield* accountRepository.count();
                const createdAccount = yield* accountRepository.create({ ...input, order: count + 1, nature });

                yield* adjustBalanceTo(createdAccount.id, currentBalance);

                return createdAccount;
            },
            effect => Db.transaction(effect)
        );

        const orFail = <A>(id: number, findAccount: Effect.Effect<A | undefined, DbError, Db>) =>
            Effect.flatMap(findAccount, account =>
                isDefined(account) ? Effect.succeed(account) : Effect.fail(new AccountNotFoundError({ id }))
            );

        const updateWithBalance = Effect.fn('AccountService.updateWithBalance')(
            function* (
                id: number,
                {
                    currentBalance,
                    ...input
                }: Partial<Omit<LiabilityAccountCreateInputInterface, 'type'>> | Partial<DepositAccountCreateInputInterface>
            ) {
                const updatedAccount = isNotEmptyArray(Object.keys(input))
                    ? yield* accountRepository.updateById(id, input)
                    : yield* orFail(id, accountRepository.findById(id));

                if (isNumber(currentBalance)) {
                    yield* adjustBalanceTo(updatedAccount.id, currentBalance);
                }

                return updatedAccount;
            },
            effect => Db.transaction(effect)
        );

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
                    const createdAccount = yield* createWithBalance(input, AccountNatureEnum.LIABILITY);

                    if (createdAccount.order === 1) {
                        yield* settingsRepository.update({ defaultAccountId: createdAccount.id });
                    }

                    return createdAccount;
                },
                effect => Db.transaction(effect)
            ),
            createDeposit: (input: DepositAccountCreateInputInterface) => createWithBalance(input, AccountNatureEnum.ASSET),
            updateById: (id: number, input: Partial<Omit<LiabilityAccountCreateInputInterface, 'type'>>) => updateWithBalance(id, input),
            updateDepositById: (
                id: number,
                input: Partial<
                    Pick<
                        DepositAccountCreateInputInterface,
                        'title' | 'icon' | 'currentBalance' | 'interestRate' | 'deadline' | 'includeInNetWorth' | 'isActive'
                    >
                >
            ) => updateWithBalance(id, input),
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
            findByIdOrFail: (id: number) => orFail(id, accountRepository.findById(id)),
            findByIdIncludingArchivedOrFail: (id: number) => orFail(id, accountRepository.findByIdIncludingArchived(id))
        };
    })
}) {
    static readonly layer = Layer.effect(AccountService, AccountService.make).pipe(
        Layer.provide([AccountRepository.layer, AccountBalanceRepository.layer, SettingsRepository.layer, TransactionService.layer])
    );
}

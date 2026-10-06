import {
    AccountDebtTypeEnum,
    AccountNatureEnum,
    AccountRepository,
    Db,
    DebtEventDirectionEnum,
    DebtEventRepository,
    DebtEventSourceEnum,
    getDebtClosedAmount
} from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import { EntryBaseValuationService } from '@budgie/market';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNumber, isPositiveNumber } from '@rnw-community/shared';

import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';

import type { DebtAccountUpdateInputInterface } from '../interface/debt-account-update-input.interface';
import type { AccountEntityInterface, DebtAccountCreateInputInterface, DebtEventEntityInterface } from '@budgie/contracts';

export class DebtAccountService extends Context.Service<DebtAccountService>()('@budgie/app/DebtAccountService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const debtEventRepository = yield* DebtEventRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const entryBaseValuationService = yield* EntryBaseValuationService;

        const getDebtNature = (debtType: AccountDebtTypeEnum): AccountNatureEnum =>
            debtType === AccountDebtTypeEnum.LENT ? AccountNatureEnum.ASSET : AccountNatureEnum.LIABILITY;

        const shouldSyncManualDebtEvents = (input: DebtAccountUpdateInputInterface): boolean =>
            isNumber(input.currentBalance) || isNumber(input.targetBalance) || isNumber(input.instrumentId);

        const getManualDebtBaseAmount = (account: AccountEntityInterface, amount: number): number | null => {
            if (!isDefined(account.targetBaseExchangeRate)) {
                return null;
            }

            return Math.round(amount * account.targetBaseExchangeRate);
        };

        const updateDebtTargetBaseValuation = Effect.fn('DebtAccountService.updateDebtTargetBaseValuation')(function* (
            account: AccountEntityInterface,
            operatedAt: Date
        ) {
            const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
                accountId: account.id,
                amount: account.targetBalance,
                operatedAt
            });

            return yield* accountRepository.updateById(account.id, {
                targetBaseInstrumentId: valuation.baseInstrumentId,
                targetBaseExchangeRate: valuation.baseExchangeRate,
                targetBaseAmount: valuation.baseAmount
            });
        });

        const updateDebtAccountFields = Effect.fn('DebtAccountService.updateDebtAccountFields')(function* (
            id: number,
            input: DebtAccountUpdateInputInterface,
            operatedAt: Date
        ) {
            const { currentBalance: _currentBalance, targetBalance, ...accountInput } = input;
            const accountUpdateInput = isNumber(targetBalance)
                ? { ...accountInput, targetBalance: convertToMicroUnits(targetBalance) }
                : accountInput;
            const updatedAccount = yield* accountRepository.updateById(id, accountUpdateInput);

            if (isNumber(targetBalance) || isNumber(accountInput.instrumentId)) {
                return yield* updateDebtTargetBaseValuation(updatedAccount, operatedAt);
            }

            return updatedAccount;
        });

        // eslint-disable-next-line @typescript-eslint/max-params -- Existing private orchestration keeps positional arguments
        const upsertManualDebtEvent = Effect.fn('DebtAccountService.upsertManualDebtEvent')(function* (
            account: AccountEntityInterface,
            manualDebtEvents: DebtEventEntityInterface[],
            direction: DebtEventDirectionEnum,
            amount: number,
            operatedAt: Date
        ) {
            const [currentDebtEvent, ...duplicateDebtEvents] = manualDebtEvents.filter(debtEvent => debtEvent.direction === direction);

            yield* debtEventRepository.deleteByIds(duplicateDebtEvents.map(debtEvent => debtEvent.id));

            if (!isPositiveNumber(amount)) {
                yield* debtEventRepository.deleteByIds(isDefined(currentDebtEvent) ? [currentDebtEvent.id] : []);

                return;
            }

            const fields = {
                amount,
                baseInstrumentId: account.targetBaseInstrumentId,
                baseExchangeRate: account.targetBaseExchangeRate,
                baseAmount: getManualDebtBaseAmount(account, amount)
            };

            if (isDefined(currentDebtEvent)) {
                yield* debtEventRepository.updateById(currentDebtEvent.id, fields);

                return;
            }

            yield* debtEventRepository.create({
                debtAccountId: account.id,
                transactionId: null,
                transactionEntryId: null,
                direction,
                source: DebtEventSourceEnum.MANUAL,
                operatedAt,
                ...fields
            });
        });

        const getDebtReturnedAmount = Effect.fn('DebtAccountService.getDebtReturnedAmount')(function* (account: AccountEntityInterface) {
            const manualDebtEvents = yield* debtEventRepository.findByAccountIdAndSource(account.id, DebtEventSourceEnum.MANUAL);

            return manualDebtEvents.reduce(
                (sum, debtEvent) => (debtEvent.direction === DebtEventDirectionEnum.CLOSE ? sum + debtEvent.amount : sum),
                0
            );
        });

        const syncManualDebtEvents = Effect.fn('DebtAccountService.syncManualDebtEvents')(function* (
            account: AccountEntityInterface,
            returnedAmount: number,
            operatedAt: Date
        ) {
            const debtEvents = yield* debtEventRepository.findByAccountId(account.id);
            const manualDebtEvents = debtEvents.filter(debtEvent => debtEvent.source === DebtEventSourceEnum.MANUAL);
            const openedAmount = isPositiveNumber(account.targetBalance) ? account.targetBalance : 0;
            const transactionOpenedAmount = debtEvents.reduce(
                (sum, debtEvent) =>
                    debtEvent.source !== DebtEventSourceEnum.MANUAL && debtEvent.direction === DebtEventDirectionEnum.OPEN
                        ? sum + debtEvent.amount
                        : sum,
                0
            );

            const manualOpenedAmount = Math.max(openedAmount - transactionOpenedAmount, 0);

            yield* upsertManualDebtEvent(account, manualDebtEvents, DebtEventDirectionEnum.OPEN, manualOpenedAmount, operatedAt);
            yield* upsertManualDebtEvent(
                account,
                manualDebtEvents,
                DebtEventDirectionEnum.CLOSE,
                getDebtClosedAmount(returnedAmount, transactionOpenedAmount + manualOpenedAmount),
                operatedAt
            );
        });

        return {
            createDebt: Effect.fn('DebtAccountService.createDebt')(
                function* (input: DebtAccountCreateInputInterface) {
                    const [{ count }] = yield* accountRepository.count();
                    const operatedAt = new Date();
                    const targetBalance = convertToMicroUnits(input.targetBalance);
                    const createdAccount = yield* accountRepository.create({
                        ...input,
                        targetBalance,
                        order: count + 1,
                        nature: getDebtNature(input.debtType)
                    });
                    const valuedAccount = yield* updateDebtTargetBaseValuation(createdAccount, operatedAt);
                    const returnedAmount = convertToMicroUnits(input.currentBalance);

                    yield* syncManualDebtEvents(valuedAccount, returnedAmount, operatedAt);
                    yield* accountBalanceIncrementalService.updateBalancesByAccountIds([valuedAccount.id]);

                    return valuedAccount;
                },
                effect => Db.transaction(effect)
            ),
            updateDebtById: Effect.fn('DebtAccountService.updateDebtById')(
                function* (id: number, input: DebtAccountUpdateInputInterface) {
                    const { currentBalance } = input;
                    const operatedAt = new Date();
                    const valuedAccount = yield* updateDebtAccountFields(id, input, operatedAt);

                    if (!shouldSyncManualDebtEvents(input)) {
                        return valuedAccount;
                    }

                    const returnedAmount = isNumber(currentBalance)
                        ? convertToMicroUnits(currentBalance)
                        : yield* getDebtReturnedAmount(valuedAccount);

                    yield* syncManualDebtEvents(valuedAccount, returnedAmount, operatedAt);
                    yield* accountBalanceIncrementalService.updateBalancesByAccountIds([valuedAccount.id]);

                    return valuedAccount;
                },
                effect => Db.transaction(effect)
            ),
            syncManualDebtEvents,
            updateDebtTargetBaseValuation
        };
    })
}) {
    static readonly layer = Layer.effect(DebtAccountService, DebtAccountService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            DebtEventRepository.layer,
            AccountBalanceIncrementalService.layer,
            EntryBaseValuationService.layer
        ])
    );
}

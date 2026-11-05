import { and, asc, between, eq, isNotNull, isNull, notInArray } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { AccountBalanceRepository } from '../../account-balance/repository/account-balance.repository';
import { AccountDebtTypeEnum } from '../../account/enum/account-debt-type.enum';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountRepository } from '../../account/repository/account.repository';
import { DebtEventDirectionEnum } from '../../debt-event/enum/debt-event-direction.enum';
import { DebtEventSourceEnum } from '../../debt-event/enum/debt-event-source.enum';
import { DebtEventRepository } from '../../debt-event/repository/debt-event.repository';
import { DebtEventEntityTable } from '../../debt-event/table/debt-event-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { INSTALLMENT_AMOUNT_TOLERANCE } from '../constant/installment-amount-tolerance.constant';
import { INSTALLMENT_DUE_DATE_TOLERANCE_DAYS } from '../constant/installment-due-date-tolerance-days.constant';
import { getInstallmentDueDate } from '../utils/get-installment-due-date.util';

import type { InstallmentPlanScheduleInterface } from '../interface/installment-plan-schedule.interface';

export class InstallmentPlanRepository extends Context.Service<InstallmentPlanRepository>()('@budgie/contracts/InstallmentPlanRepository', {
    make: Effect.gen(function* () {
        const debtEventRepository = yield* DebtEventRepository;
        const accountRepository = yield* AccountRepository;
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const queryBuilder = new QueryBuilder();

        const findParts = (debtAccountId: number) =>
            Db.query(db =>
                db
                    .select({
                        transactionId: TransactionEntityTable.id,
                        entryId: TransactionEntryEntityTable.id,
                        accountId: TransactionEntryEntityTable.accountId,
                        categoryId: TransactionEntryEntityTable.categoryId,
                        categorySource: TransactionEntryEntityTable.categorySource,
                        operatedAt: TransactionEntityTable.operatedAt,
                        title: TransactionEntityTable.title,
                        externalSource: TransactionEntityTable.externalSource,
                        consolidationType: TransactionEntityTable.consolidationType,
                        amount: DebtEventEntityTable.amount
                    })
                    .from(DebtEventEntityTable)
                    .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, DebtEventEntityTable.transactionId))
                    .innerJoin(
                        TransactionEntryEntityTable,
                        and(
                            eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id),
                            transactionFilters.buildPrimaryLedgerEntryCondition()
                        )
                    )
                    .where(
                        and(
                            eq(DebtEventEntityTable.debtAccountId, debtAccountId),
                            eq(DebtEventEntityTable.direction, DebtEventDirectionEnum.CLOSE),
                            isNull(DebtEventEntityTable.deletedAt),
                            isNull(TransactionEntityTable.deletedAt)
                        )
                    )
                    .orderBy(asc(TransactionEntityTable.operatedAt), asc(TransactionEntityTable.id))
            );

        const getNextDueAt = (anchorAt: Date, latestPartAt: Date | null, fallbackMonthOffset: number) => {
            if (!isDefined(latestPartAt)) {
                return getInstallmentDueDate(anchorAt, fallbackMonthOffset);
            }

            const getEarliestMatchAt = (monthOffset: number) => {
                const dueAt = getInstallmentDueDate(anchorAt, monthOffset);

                return new Date(
                    dueAt.getFullYear(),
                    dueAt.getMonth(),
                    dueAt.getDate() - INSTALLMENT_DUE_DATE_TOLERANCE_DAYS,
                    dueAt.getHours(),
                    dueAt.getMinutes(),
                    dueAt.getSeconds()
                );
            };
            let nextMonthOffset = 1;

            while (getEarliestMatchAt(nextMonthOffset) <= latestPartAt) {
                nextMonthOffset += 1;
            }

            return getInstallmentDueDate(anchorAt, nextMonthOffset);
        };

        return {
            findParts,
            findCandidates: (accountId: number, from: Date, to: Date) =>
                Db.query(db =>
                    db
                        .select({
                            transactionId: TransactionEntityTable.id,
                            operatedAt: TransactionEntityTable.operatedAt,
                            title: TransactionEntityTable.title,
                            externalSource: TransactionEntityTable.externalSource,
                            amount: TransactionEntryEntityTable.amount
                        })
                        .from(TransactionEntityTable)
                        .innerJoin(
                            TransactionEntryEntityTable,
                            and(
                                eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id),
                                transactionFilters.buildPrimaryLedgerEntryCondition()
                            )
                        )
                        .where(
                            and(
                                transactionFilters.buildVisibleTransactionCondition(),
                                eq(TransactionEntityTable.type, TransactionTypeEnum.EXPENSE),
                                eq(TransactionEntryEntityTable.accountId, accountId),
                                between(TransactionEntityTable.operatedAt, from, to),
                                notInArray(
                                    TransactionEntityTable.id,
                                    queryBuilder
                                        .select({ transactionId: DebtEventEntityTable.transactionId })
                                        .from(DebtEventEntityTable)
                                        .where(and(isNotNull(DebtEventEntityTable.transactionId), isNull(DebtEventEntityTable.deletedAt)))
                                )
                            )
                        )
                ),
            getSchedule: Effect.fn('InstallmentPlanRepository.getSchedule')(function* (accountId: number) {
                const account = yield* accountRepository.findById(accountId);

                if (
                    !isDefined(account) ||
                    account.debtType !== AccountDebtTypeEnum.INSTALLMENT ||
                    !isPositiveNumber(account.installmentCount)
                ) {
                    return null;
                }

                const progress = (yield* accountBalanceRepository.getDebtAccountProgressByAccountId(accountId)).at(0);
                const parts = yield* findParts(accountId);
                const firstPart = parts.at(0);
                const openingEvents = yield* debtEventRepository.findByAccountIdAndSource(accountId, DebtEventSourceEnum.OPENING);
                const anchorAt = firstPart?.operatedAt ?? openingEvents.at(0)?.operatedAt;
                const latestPart = parts.at(-1);
                const totalAmount = progress?.totalAmount ?? 0;
                const paidAmount = progress?.paidAmount ?? 0;
                const remainingAmount = progress?.outstandingAmount ?? 0;
                const regularAmount = Math.round(totalAmount / account.installmentCount);
                const isOpen = isPositiveNumber(remainingAmount);
                const isFlexiblePlan = isDefined(latestPart) && latestPart.externalSource !== ExternalSourceEnum.MONOBANK;
                const isLastPart = isFlexiblePlan
                    ? remainingAmount <= regularAmount + INSTALLMENT_AMOUNT_TOLERANCE
                    : parts.length >= account.installmentCount - 1;
                const nextAmount = isLastPart ? remainingAmount : Math.min(regularAmount, remainingAmount);
                const paidCount =
                    isFlexiblePlan && isPositiveNumber(regularAmount)
                        ? Math.min(account.installmentCount, Math.floor((paidAmount + INSTALLMENT_AMOUNT_TOLERANCE) / regularAmount))
                        : parts.length;
                const nextDueAt = isDefined(anchorAt)
                    ? getNextDueAt(anchorAt, isFlexiblePlan ? latestPart.operatedAt : null, isDefined(firstPart) ? parts.length : 1)
                    : null;
                const schedule: InstallmentPlanScheduleInterface = {
                    installmentCount: account.installmentCount,
                    paidCount,
                    totalAmount,
                    paidAmount,
                    remainingAmount,
                    nextDueAt: isOpen ? nextDueAt : null,
                    nextAmount: isOpen ? nextAmount : null,
                    instrumentId: account.instrumentId
                };

                return schedule;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(InstallmentPlanRepository, InstallmentPlanRepository.make).pipe(
        Layer.provide([AccountRepository.layer, AccountBalanceRepository.layer, DebtEventRepository.layer])
    );
}

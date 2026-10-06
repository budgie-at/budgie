import { and, asc, between, eq, isNotNull, isNull, notInArray } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { AccountBalanceRepository } from '../../account-balance/repository/account-balance.repository';
import { AccountDebtTypeEnum } from '../../account/enum/account-debt-type.enum';
import { AccountRepository } from '../../account/repository/account.repository';
import { DebtEventDirectionEnum } from '../../debt-event/enum/debt-event-direction.enum';
import { DebtEventEntityTable } from '../../debt-event/table/debt-event-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { getInstallmentDueDate } from '../util/get-installment-due-date.util';

import type { InstallmentPlanScheduleInterface } from '../interface/installment-plan-schedule.interface';

export class InstallmentPlanRepository extends Context.Service<InstallmentPlanRepository>()('@budgie/contracts/InstallmentPlanRepository', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const transactionFilters = new BaseTransactionFilterRepository();
        const queryBuilder = new QueryBuilder();

        const findParts = (debtAccountId: number) =>
            Db.query(db =>
                db
                    .select({
                        transactionId: TransactionEntityTable.id,
                        accountId: TransactionEntryEntityTable.accountId,
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

        return {
            findParts,
            findCandidates: (accountId: number, from: Date, to: Date) =>
                Db.query(db =>
                    db
                        .select({
                            transactionId: TransactionEntityTable.id,
                            operatedAt: TransactionEntityTable.operatedAt,
                            title: TransactionEntityTable.title,
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
                const [firstPart] = parts;
                const totalAmount = progress?.totalAmount ?? 0;
                const remainingAmount = progress?.outstandingAmount ?? 0;
                const isOpen = isPositiveNumber(remainingAmount);
                const isLastPart = parts.length >= account.installmentCount - 1;
                const nextAmount = isLastPart
                    ? remainingAmount
                    : Math.min(Math.round(totalAmount / account.installmentCount), remainingAmount);
                const schedule: InstallmentPlanScheduleInterface = {
                    installmentCount: account.installmentCount,
                    paidCount: parts.length,
                    totalAmount,
                    paidAmount: progress?.paidAmount ?? 0,
                    remainingAmount,
                    nextDueAt: isOpen && isDefined(firstPart) ? getInstallmentDueDate(firstPart.operatedAt, parts.length) : null,
                    nextAmount: isOpen ? nextAmount : null,
                    instrumentId: account.instrumentId
                };

                return schedule;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(InstallmentPlanRepository, InstallmentPlanRepository.make).pipe(
        Layer.provide([AccountRepository.layer, AccountBalanceRepository.layer])
    );
}

import {
    AccountEntityTable,
    DebtEventEntityTable,
    InstallmentPlanRepository,
    InstrumentEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import type { InstallmentPlanScheduleInterface } from '@budgie/contracts';

const installmentPlanScheduleAtom = databaseQueryFamily(
    [AccountEntityTable, InstrumentEntityTable, DebtEventEntityTable, TransactionEntityTable, TransactionEntryEntityTable],
    InstallmentPlanRepository,
    (installmentPlanRepository, accountId: number) => installmentPlanRepository.getSchedule(accountId)
);

export const useInstallmentPlanScheduleQuery = (accountId: number): InstallmentPlanScheduleInterface | null =>
    AsyncResult.getOrElse(useLiveAtomValue(installmentPlanScheduleAtom(accountId)), () => null);

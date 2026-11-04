import { AccountEntityTable, SyncEntityTable, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import { InzhurSetupService } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

const inzhurStatementReminderAtom = databaseQueryAtom(
    [AccountEntityTable, SyncEntityTable, TransactionEntityTable, TransactionEntryEntityTable],
    Effect.flatMap(InzhurSetupService, inzhurSetupService => inzhurSetupService.findStatementReminder(new Date()))
);

export const useInzhurStatementReminderQuery = () =>
    AsyncResult.getOrElse(useLiveAtomValue(inzhurStatementReminderAtom), () => null) ?? null;

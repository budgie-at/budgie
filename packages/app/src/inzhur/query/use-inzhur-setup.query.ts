import { AccountEntityTable, BankIntegrationEntityTable, SyncEntityTable } from '@budgie/contracts';
import { InzhurSetupService } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

const inzhurSetupAtom = databaseQueryAtom(
    [AccountEntityTable, BankIntegrationEntityTable, SyncEntityTable],
    Effect.flatMap(InzhurSetupService, inzhurSetupService => inzhurSetupService.findSetup())
);

export const useInzhurSetupQuery = () => {
    const result = useLiveAtomValue(inzhurSetupAtom);

    return { setup: AsyncResult.getOrElse(result, () => null), isLoading: AsyncResult.isInitial(result) };
};

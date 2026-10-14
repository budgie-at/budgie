import { AccountEntityTable, AccountRepository, AccountWithInstrumentEntityInterface, InstrumentEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

export const archivedAccountsAtom = databaseQueryAtom(
    [AccountEntityTable, InstrumentEntityTable],
    Effect.flatMap(AccountRepository, accountRepository => accountRepository.getAllArchived())
);

export const useArchivedAccountsQuery = () =>
    AsyncResult.getOrElse(useLiveAtomValue(archivedAccountsAtom), (): AccountWithInstrumentEntityInterface[] => []);

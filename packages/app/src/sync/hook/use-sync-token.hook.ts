import {
    AccountEntityTable,
    AccountRepository,
    BankIntegrationEntityTable,
    BankIntegrationRepository,
    InstrumentEntityTable
} from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

const syncTokenAtom = Atom.family((accountId: number) =>
    databaseQueryAtom(
        [AccountEntityTable, InstrumentEntityTable, BankIntegrationEntityTable],
        Effect.gen(function* () {
            const accountRepository = yield* AccountRepository;
            const bankIntegrationRepository = yield* BankIntegrationRepository;
            const account = yield* accountRepository.findById(accountId);
            const integrationId = account?.integrationId;

            if (!isDefined(integrationId)) {
                return '';
            }

            return (yield* bankIntegrationRepository.findById(integrationId))?.token ?? '';
        })
    )
);

export const useSyncToken = (accountId: number): string => AsyncResult.getOrElse(useLiveAtomValue(syncTokenAtom(accountId)), () => '');

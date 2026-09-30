import { BankIntegrationEntityTable, BankIntegrationRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

const bankIntegrationCountAtom = databaseQueryAtom(
    [BankIntegrationEntityTable],
    Effect.flatMap(BankIntegrationRepository, bankIntegrationRepository => bankIntegrationRepository.count())
);

export const useGetBankIntegrationCountQuery = (): number =>
    AsyncResult.getOrElse(useLiveAtomValue(bankIntegrationCountAtom), () => []).at(0)?.count ?? 0;

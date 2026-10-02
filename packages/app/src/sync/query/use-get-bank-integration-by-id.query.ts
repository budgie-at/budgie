import { BankIntegrationEntityTable, BankIntegrationRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const bankIntegrationByIdAtom = databaseQueryFamily(
    [BankIntegrationEntityTable],
    BankIntegrationRepository,
    (bankIntegrationRepository, id: number) => bankIntegrationRepository.findById(id)
);

export const useGetBankIntegrationByIdQuery = (id: number) => {
    const result = useLiveAtomValue(bankIntegrationByIdAtom(id));

    return { integration: AsyncResult.getOrElse(result, () => null) ?? null, isLoading: AsyncResult.isInitial(result) };
};

import { TransactionViewRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { TRANSACTION_LIST_TABLES } from '../constant/transaction-list-tables.constant';

import type { LanguageEnum } from '@budgie/contracts';

const transactionByIdAtom = databaseQueryFamily(
    TRANSACTION_LIST_TABLES,
    TransactionViewRepository,
    (transactionViewRepository, [transactionId, language]: readonly [number, LanguageEnum]) =>
        transactionViewRepository.getById(transactionId, language)
);

export const useGetTransactionByIdQuery = (id: number | null) => {
    const language = useSetting('language');
    const shouldQuery = isPositiveNumber(id);
    const transactionId = shouldQuery ? id : 0;
    const result = useLiveAtomValue(transactionByIdAtom([transactionId, language]));

    if (!shouldQuery) {
        return { transaction: null, isLoading: false };
    }

    return AsyncResult.isInitial(result)
        ? { transaction: null, isLoading: true }
        : { transaction: AsyncResult.getOrElse(result, () => null), isLoading: false };
};

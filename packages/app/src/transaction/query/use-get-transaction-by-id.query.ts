import { TransactionViewRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { TRANSACTION_LIST_TABLES } from '../constant/transaction-list-tables.constant';

import type { LanguageEnum } from '@budgie/contracts';

export const transactionByIdAtom = databaseQueryFamily(
    TRANSACTION_LIST_TABLES,
    TransactionViewRepository,
    (transactionViewRepository, [transactionId, language]: readonly [number, LanguageEnum]) =>
        transactionViewRepository.getById(transactionId, language)
);

const noTransactionAtom = Atom.make(AsyncResult.success(null));

export const useGetTransactionByIdQuery = (id: number | null) => {
    const language = useSetting('language');
    const shouldQuery = isPositiveNumber(id);
    const result = useLiveAtomValue(shouldQuery ? transactionByIdAtom([id, language]) : noTransactionAtom);

    if (!shouldQuery) {
        return { transaction: null, isLoading: false };
    }

    return AsyncResult.isInitial(result)
        ? { transaction: null, isLoading: true }
        : { transaction: AsyncResult.getOrElse(result, () => null), isLoading: false };
};

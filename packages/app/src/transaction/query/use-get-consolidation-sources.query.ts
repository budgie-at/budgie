import { Db, TransactionEntryTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { appAtomRuntime } from '../../@generic/runtime/app.runtime';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { ConsolidationSourceRowInterface, LanguageEnum } from '@budgie/contracts';

const orderSourcesByTransferChain = (rows: ConsolidationSourceRowInterface[]): ConsolidationSourceRowInterface[] => {
    const sendingAccounts = new Set(rows.filter(row => row.entryType === TransactionEntryTypeEnum.CREDIT).map(row => row.accountId));
    const receivingAccounts = new Set(rows.filter(row => row.entryType === TransactionEntryTypeEnum.DEBIT).map(row => row.accountId));
    const accounts = [...new Set(rows.map(row => row.accountId))];

    const originAccount = accounts.find(accountId => sendingAccounts.has(accountId) && !receivingAccounts.has(accountId));
    const targetAccount = accounts.find(accountId => receivingAccounts.has(accountId) && !sendingAccounts.has(accountId));
    const bridgeAccounts = accounts.filter(accountId => sendingAccounts.has(accountId) && receivingAccounts.has(accountId));
    const chainAccounts = [originAccount, ...bridgeAccounts, targetAccount].filter(isDefined);
    const orderedAccounts = [...chainAccounts, ...accounts.filter(accountId => !chainAccounts.includes(accountId))];

    const rankOf = (row: ConsolidationSourceRowInterface): number => {
        const arrivalBeforeDeparture = row.entryType === TransactionEntryTypeEnum.DEBIT ? 0 : 1;

        return orderedAccounts.indexOf(row.accountId) * 2 + arrivalBeforeDeparture;
    };

    return [...rows].sort((left, right) => rankOf(left) - rankOf(right));
};

const consolidationSourcesAtom = Atom.family(([transactionId, language]: readonly [number, LanguageEnum]) =>
    appAtomRuntime.atom(
        Effect.all(
            [
                transactionRepository.findConsolidationSources(transactionId, language),
                Db.query(() => transactionRepository.getById(transactionId, language))
            ],
            { concurrency: 'unbounded' }
        ).pipe(
            Effect.map(([rows, canonical]) => ({
                sources: orderSourcesByTransferChain(rows),
                consolidationType: canonical?.consolidationType ?? null
            })),
            Effect.tapCause(Effect.logError)
        )
    )
);

export const useGetConsolidationSourcesQuery = (transactionId: number) => {
    const language = useSetting('language');
    const result = useAtomValue(consolidationSourcesAtom([transactionId, language]));
    const data = AsyncResult.isSuccess(result) ? result.value : null;

    return {
        sources: data?.sources ?? [],
        consolidationType: data?.consolidationType ?? null,
        hasError: AsyncResult.isFailure(result),
        isLoading: result.waiting
    };
};

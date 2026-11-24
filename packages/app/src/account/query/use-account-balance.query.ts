import { AccountBalanceRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isPositiveNumber } from '@rnw-community/shared';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { ACCOUNT_BALANCE_TABLES } from '../constant/account-balance-tables.constant';

import { useCachedBalanceQuery } from './use-cached-balance.query';

const zeroAccountBalanceAtom = Atom.make(AsyncResult.success([{ balance: 0 }]));

export const accountBalanceAtom = databaseQueryFamily(
    ACCOUNT_BALANCE_TABLES,
    AccountBalanceRepository,
    (accountBalanceRepository, accountId: number) => accountBalanceRepository.getByAccountId(accountId)
);

export const useAccountBalanceQuery = (accountId: number) =>
    useCachedBalanceQuery(isPositiveNumber(accountId) ? accountBalanceAtom(accountId) : zeroAccountBalanceAtom);

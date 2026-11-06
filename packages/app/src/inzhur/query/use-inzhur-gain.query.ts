import {
    AccountEntityTable,
    BankIntegrationEntityTable,
    InstrumentDailyMarketPriceEntityTable,
    InstrumentEntityTable,
    SyncEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { InzhurGainService } from '@budgie/sync';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const GAIN_TABLES = [
    AccountEntityTable,
    BankIntegrationEntityTable,
    SyncEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    InstrumentDailyMarketPriceEntityTable,
    InstrumentEntityTable
];

const institutionReportAtom = databaseQueryFamily(GAIN_TABLES, InzhurGainService, (inzhurGainService, today: string) =>
    inzhurGainService.getInstitutionReport(today)
);

const fundReportAtom = databaseQueryFamily(GAIN_TABLES, InzhurGainService, (inzhurGainService, key: string) => {
    const [accountId, today] = key.split('|');

    return inzhurGainService.getFundReport(Number(accountId), today);
});

const fundCostReturnAtom = databaseQueryFamily(GAIN_TABLES, InzhurGainService, (inzhurGainService, key: string) => {
    const [accountId, today] = key.split('|');

    return inzhurGainService.getFundCostReturn(Number(accountId), today);
});

const getToday = () => new Date().toISOString().slice(0, 10);

export const useInzhurInstitutionGainQuery = () => AsyncResult.getOrElse(useLiveAtomValue(institutionReportAtom(getToday())), () => null);

export const useInzhurFundGainQuery = (fundAccountId: number) =>
    AsyncResult.getOrElse(useLiveAtomValue(fundReportAtom(`${fundAccountId}|${getToday()}`)), () => null);

export const useInzhurFundCostReturnQuery = (fundAccountId: number) =>
    AsyncResult.getOrElse(useLiveAtomValue(fundCostReturnAtom(`${fundAccountId}|${getToday()}`)), () => null);

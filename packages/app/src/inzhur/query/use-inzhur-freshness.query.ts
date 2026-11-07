import {
    AccountEntityTable,
    BankIntegrationEntityTable,
    CurrencyEnum,
    InstrumentDailyMarketPriceEntityTable,
    InstrumentEntityTable,
    InstrumentRepository,
    SyncEntityTable
} from '@budgie/contracts';
import { InstrumentDailyMarketPriceRepository } from '@budgie/market';
import { InzhurSetupService } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

import type { InzhurFreshnessInterface } from '../interface/inzhur-freshness.interface';

const inzhurFreshnessAtom = databaseQueryAtom(
    [AccountEntityTable, BankIntegrationEntityTable, SyncEntityTable, InstrumentEntityTable, InstrumentDailyMarketPriceEntityTable],
    Effect.gen(function* () {
        const setup = yield* Effect.flatMap(InzhurSetupService, inzhurSetupService => inzhurSetupService.findSetup());
        const hryvnia = yield* Effect.flatMap(InstrumentRepository, instrumentRepository =>
            instrumentRepository.findByCode(CurrencyEnum.UAH)
        );

        if (!isDefined(setup) || !isDefined(hryvnia)) {
            return null;
        }

        const instrumentDailyMarketPriceRepository = yield* InstrumentDailyMarketPriceRepository;
        const latestPrices = yield* Effect.forEach(setup.fundAccounts, account =>
            instrumentDailyMarketPriceRepository.findLatest(account.instrumentId, hryvnia.id)
        );
        const priceDates = latestPrices
            .filter(isDefined)
            .map(price => price.priceDate)
            .sort();

        return { priceDate: priceDates.at(-1) ?? null, statementDate: setup.lastStatementDate } satisfies InzhurFreshnessInterface;
    })
);

export const useInzhurFreshnessQuery = () => AsyncResult.getOrElse(useLiveAtomValue(inzhurFreshnessAtom), () => null) ?? null;

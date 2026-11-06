import {
    AccountTypeEnum,
    AccountRepository,
    ExternalSourceEnum,
    InstrumentPriceProviderEnum,
    InstrumentRepository,
    InstrumentTypeEnum,
    SyncModeEnum,
    SyncRepository,
    UserIconNameEnum
} from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { INZHUR_CANONICAL_FUNDS } from '../constant/inzhur-canonical-funds.constant';
import { toInzhurCanonicalFundName } from '../utils/to-inzhur-canonical-fund-name.util';
import { toInzhurShortName } from '../utils/to-inzhur-short-name.util';

import type { InzhurSetupInterface } from '../interface/inzhur-setup.interface';

export class InzhurFundAccountService extends Context.Service<InzhurFundAccountService>()('@budgie/sync/InzhurFundAccountService', {
    make: Effect.gen(function* () {
        const INZHUR_SYNTHETIC_FUND_CODE_PREFIX = 'INZHUR:';
        const accountService = yield* AccountService;
        const accountRepository = yield* AccountRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const syncRepository = yield* SyncRepository;
        const provider = ExternalSourceEnum.INZHUR;

        const resolveInstrument = Effect.fnUntraced(function* (code: string, rawName: string) {
            const name = toInzhurCanonicalFundName(rawName);
            const existingInstrument =
                (yield* instrumentRepository.findByCode(code)) ??
                (yield* instrumentRepository.findByTypeAndPriceProviderWithProviderInstrumentId(
                    InstrumentTypeEnum.FUND,
                    InstrumentPriceProviderEnum.INZHUR
                )).find(candidate => candidate.name.toLowerCase() === name.toLowerCase());

            if (isDefined(existingInstrument)) {
                return existingInstrument;
            }

            return yield* instrumentRepository.create({
                type: InstrumentTypeEnum.FUND,
                code,
                name,
                symbol: name.split(' ').at(-1)?.toUpperCase() ?? code,
                priceProvider: InstrumentPriceProviderEnum.INZHUR,
                providerInstrumentId: code
            });
        });

        const create = Effect.fn('InzhurFundAccountService.create')(function* (code: string, rawName: string, integrationId: number) {
            const instrument = yield* resolveInstrument(code, rawName);
            const existingAccount = (yield* accountRepository.findByIntegrationId(integrationId)).find(
                account => account.externalId === `inzhur:${instrument.code}`
            );

            if (isDefined(existingAccount)) {
                return existingAccount;
            }

            const createdAccounts = yield* accountService.bulkCreate([
                {
                    title: instrument.name,
                    type: AccountTypeEnum.STOCKS,
                    icon: INZHUR_CANONICAL_FUNDS.find(fund => fund.name === instrument.name)?.icon ?? UserIconNameEnum.ChartLine,
                    instrumentId: instrument.id,
                    currentBalance: 0,
                    externalId: `inzhur:${instrument.code}`,
                    externalSource: provider,
                    integrationId
                }
            ]);
            const createdAccount = Object.values(createdAccounts).at(0);

            if (!isDefined(createdAccount)) {
                return yield* Effect.die(new Error('Failed to create Inzhur fund account'));
            }

            yield* syncRepository.create({ accountId: createdAccount.id, provider, enabled: true, mode: SyncModeEnum.FORWARD });

            return createdAccount;
        });

        const findByCanonicalName = Effect.fnUntraced(function* (setup: InzhurSetupInterface, name: string) {
            const instruments = yield* instrumentRepository.getAll;

            return setup.fundAccounts.flatMap(account => {
                const instrument = instruments.find(candidate => candidate.id === account.instrumentId);

                return isDefined(instrument) && instrument.name.toLowerCase() === name.toLowerCase() ? [{ account, instrument }] : [];
            });
        });

        return {
            create,
            ensureByName: Effect.fn('InzhurFundAccountService.ensureByName')(function* (setup: InzhurSetupInterface, fundName: string) {
                const name = toInzhurCanonicalFundName(fundName);
                const existing = (yield* findByCanonicalName(setup, name)).at(0);

                if (isDefined(existing)) {
                    return existing.account;
                }

                const suffix = toInzhurShortName(name).toUpperCase().replaceAll(/\s+/gu, '-');

                return yield* create(`${INZHUR_SYNTHETIC_FUND_CODE_PREFIX}${suffix}`, name, setup.integration.id);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(InzhurFundAccountService, InzhurFundAccountService.make).pipe(
        Layer.provide([AccountRepository.layer, AccountService.layer, InstrumentRepository.layer, SyncRepository.layer])
    );
}

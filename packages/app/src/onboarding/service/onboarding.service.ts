import { AccountRepository, AccountTypeEnum, Db, InstrumentRepository, SettingsRepository } from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { getLocales } from 'expo-localization';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { i18nGetOSLocale } from '../../i18n/utils/i18n.util';
import { DEFAULT_INSTRUMENT } from '../../settings/constants/default-instrument.constant';

import type { OnboardingAccountOptionInterface } from '../interface/onboarding-account-option.interface';
import type { OnboardingBalanceInputInterface } from '../interface/onboarding-balance-input.interface';

export class OnboardingService extends Context.Service<OnboardingService>()('@budgie/app/OnboardingService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const settingsRepository = yield* SettingsRepository;
        const accountService = yield* AccountService;

        const detectDeviceInstrumentCode = (): string | null => {
            for (const locale of getLocales()) {
                if (isNotEmptyString(locale.currencyCode)) {
                    return locale.currencyCode.toUpperCase();
                }
            }

            return null;
        };

        const resolveDeviceInstrumentId = Effect.fn('OnboardingService.resolveDeviceInstrumentId')(function* () {
            const code = detectDeviceInstrumentCode();

            if (!isDefined(code)) {
                return DEFAULT_INSTRUMENT.id;
            }

            const instrument = yield* instrumentRepository.findByCode(code);

            return instrument?.id ?? DEFAULT_INSTRUMENT.id;
        });

        const createOnboardingAccount = Effect.fn('OnboardingService.createOnboardingAccount')(function* (
            account: OnboardingAccountOptionInterface,
            instrumentId: number
        ) {
            const input = { ...account, currentBalance: 0, includeInNetWorth: true, instrumentId };

            yield* account.type === AccountTypeEnum.DEPOSIT
                ? accountService.createDeposit({ ...input, iban: null, deadline: null, interestRate: null })
                : accountService.create(input);
        });

        return {
            initializeLocale: Effect.fn('OnboardingService.initializeLocale')(function* () {
                const { onboardingStep, isOnboardingCompleted } = yield* settingsRepository.getSettings();
                const [{ count }] = yield* accountRepository.count();

                if (isOnboardingCompleted || isPositiveNumber(onboardingStep) || isPositiveNumber(count)) {
                    return;
                }

                const language = i18nGetOSLocale();
                const instrumentId = yield* resolveDeviceInstrumentId();

                yield* settingsRepository.update({ defaultInstrumentId: instrumentId, language });
            }),
            provisionAccounts: Effect.fn('OnboardingService.provisionAccounts')(function* (
                accounts: readonly OnboardingAccountOptionInterface[]
            ) {
                const { defaultInstrumentId } = yield* settingsRepository.getSettings();
                const instrumentId = defaultInstrumentId ?? DEFAULT_INSTRUMENT.id;
                const existingAccounts = yield* accountRepository.getAllActiveAccounts();
                const existingTypes = new Set(existingAccounts.map(existingAccount => existingAccount.type));
                const accountsToCreate = accounts.filter(account => !existingTypes.has(account.type));

                yield* Effect.forEach(accountsToCreate, account => createOnboardingAccount(account, instrumentId), { discard: true });
            }),
            saveBalances: (balances: OnboardingBalanceInputInterface[]) =>
                Db.transaction(
                    Effect.forEach(
                        balances,
                        ({ accountId, balance }) => accountService.updateById(accountId, { currentBalance: balance }),
                        {
                            discard: true
                        }
                    )
                ),
            complete: () => Db.transaction(settingsRepository.update({ isOnboardingCompleted: true }))
        };
    })
}) {
    static readonly layer = Layer.effect(OnboardingService, OnboardingService.make).pipe(
        Layer.provide([AccountRepository.layer, InstrumentRepository.layer, SettingsRepository.layer, AccountService.layer])
    );
}

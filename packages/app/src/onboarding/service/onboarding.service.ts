import { AccountTypeEnum, Db, UserIconNameEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { getLocales } from 'expo-localization';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { accountRepository, instrumentRepository, settingsRepository } from '../../@generic/drizzle/db/db';
import { accountService } from '../../account/service/account.service';
import { i18nGetOSLocale } from '../../i18n/util/i18n.util';
import { DEFAULT_INSTRUMENT } from '../../settings/constants/default-instrument.constant';
import { updateSettingsMutation } from '../../settings/mutation/update-settings.mutation';

import type { OnboardingAccountInputInterface } from '../interface/onboarding-account-input.interface';

class OnboardingService {
    private static readonly ONBOARDING_ACCOUNT_ICON: Partial<Record<AccountTypeEnum, UserIconNameEnum>> = {
        [AccountTypeEnum.CASH]: UserIconNameEnum.Wallet,
        [AccountTypeEnum.BANK]: UserIconNameEnum.Landmark,
        [AccountTypeEnum.CRYPTO]: UserIconNameEnum.Bitcoin,
        [AccountTypeEnum.DEBT]: UserIconNameEnum.HandCoins
    };

    readonly initializeLocale = Effect.fn('OnboardingService.initializeLocale')(function* (this: OnboardingService) {
        const { onboardingStep, isOnboardingCompleted } = yield* settingsRepository.getSettings();
        const [{ count }] = yield* Db.query(() => accountRepository.count());

        if (isOnboardingCompleted || isPositiveNumber(onboardingStep) || isPositiveNumber(count)) {
            return;
        }

        const language = i18nGetOSLocale();
        const instrumentId = yield* this.resolveDeviceInstrumentId();

        yield* updateSettingsMutation({ defaultInstrumentId: instrumentId, language });
    });

    readonly provisionAccounts = Effect.fn('OnboardingService.provisionAccounts')(function* (
        this: OnboardingService,
        accounts: OnboardingAccountInputInterface[]
    ) {
        const { defaultInstrumentId } = yield* settingsRepository.getSettings();
        const instrumentId = defaultInstrumentId ?? DEFAULT_INSTRUMENT.id;
        const existingAccounts = yield* accountRepository.getAllActiveAccounts();
        const existingTypes = new Set(existingAccounts.map(existingAccount => existingAccount.type));
        const accountsToCreate = accounts.filter(account => !existingTypes.has(account.type));

        yield* Effect.forEach(accountsToCreate, account => this.createOnboardingAccount(account, instrumentId), { discard: true });
    });

    readonly changeOnboardingCurrency = Effect.fn('OnboardingService.changeOnboardingCurrency')(function* (
        accountId: number,
        instrumentId: number
    ) {
        yield* updateSettingsMutation({ defaultInstrumentId: instrumentId });

        return yield* accountService.updateById(accountId, { instrumentId });
    });

    readonly complete = Effect.fn('OnboardingService.complete')(function* () {
        yield* updateSettingsMutation({ isOnboardingCompleted: true });
    });

    private readonly createOnboardingAccount = Effect.fn('OnboardingService.createOnboardingAccount')(function* (
        account: OnboardingAccountInputInterface,
        instrumentId: number
    ) {
        yield* accountService.create({
            type: account.type,
            title: account.title,
            currentBalance: 0,
            icon: OnboardingService.ONBOARDING_ACCOUNT_ICON[account.type] ?? UserIconNameEnum.Wallet,
            includeInNetWorth: true,
            instrumentId
        });
    });

    private readonly resolveDeviceInstrumentId = Effect.fn('OnboardingService.resolveDeviceInstrumentId')(
        function* (this: OnboardingService) {
            const code = this.detectDeviceInstrumentCode();

            if (!isDefined(code)) {
                return DEFAULT_INSTRUMENT.id;
            }

            const instrument = yield* instrumentRepository.findByCode(code);

            return instrument?.id ?? DEFAULT_INSTRUMENT.id;
        }
    );

    private detectDeviceInstrumentCode(): string | null {
        for (const locale of getLocales()) {
            if (isNotEmptyString(locale.currencyCode)) {
                return locale.currencyCode.toUpperCase();
            }
        }

        return null;
    }
}

export const onboardingService = new OnboardingService();

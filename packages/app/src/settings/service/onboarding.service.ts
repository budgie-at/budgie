import { AccountTypeEnum, LanguageEnum, UserIconNameEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { getLocales } from 'expo-localization';

import { getErrorMessage, isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { accountRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { accountService } from '../../account/service/account.service';
import { i18nGetOSLocale } from '../../i18n/util/i18n.util';
import { DEFAULT_INSTRUMENT } from '../constants/default-instrument.constant';
import { updateSettingsMutation } from '../mutation/update-settings.mutation';

class OnboardingService {
    /* oxlint-disable lingui/no-unlocalized-strings -- persisted account title, resolved once at provisioning and never re-rendered */
    private static readonly CASH_ACCOUNT_TITLES: Record<LanguageEnum, string> = {
        [LanguageEnum.EN]: 'Cash',
        [LanguageEnum.DE]: 'Bargeld',
        [LanguageEnum.ES]: 'Efectivo',
        [LanguageEnum.FR]: 'Espèces',
        [LanguageEnum.UK]: 'Готівка'
    };
    /* oxlint-enable lingui/no-unlocalized-strings */

    private provisioningPromise: Promise<boolean> | null = null;

    @Log('enter', result => `done didProvision=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async provisionFirstAccount(): Promise<boolean> {
        this.provisioningPromise ??= this.runProvisioning().finally(() => {
            this.provisioningPromise = null;
        });

        return this.provisioningPromise;
    }

    @Log(
        (accountId, instrumentId) => `enter accountId=${accountId} instrumentId=${instrumentId}`,
        (result, accountId, instrumentId) => `done accountId=${accountId} instrumentId=${instrumentId} updatedId=${result.id}`,
        (error, accountId, instrumentId) => `throw accountId=${accountId} instrumentId=${instrumentId} error=${getErrorMessage(error)}`
    )
    async changeOnboardingCurrency(accountId: number, instrumentId: number) {
        await updateSettingsMutation({ defaultInstrumentId: instrumentId });

        return accountService.updateById(accountId, { instrumentId });
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async complete(): Promise<void> {
        await updateSettingsMutation({ isOnboardingCompleted: true });
    }

    private async runProvisioning(): Promise<boolean> {
        const [{ count }] = await accountRepository.count();

        if (isPositiveNumber(count)) {
            return false;
        }

        const language = i18nGetOSLocale();
        const instrumentId = await this.resolveDeviceInstrumentId();

        await accountService.create({
            type: AccountTypeEnum.CASH,
            title: OnboardingService.CASH_ACCOUNT_TITLES[language],
            currentBalance: 0,
            icon: UserIconNameEnum.Wallet,
            includeInNetWorth: true,
            instrumentId
        });

        await updateSettingsMutation({ defaultInstrumentId: instrumentId, language });

        return true;
    }

    private async resolveDeviceInstrumentId(): Promise<number> {
        const code = this.detectDeviceInstrumentCode();

        if (!isDefined(code)) {
            return DEFAULT_INSTRUMENT.id;
        }

        const instrument = await instrumentRepository.findByCode(code);

        return instrument?.id ?? DEFAULT_INSTRUMENT.id;
    }

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

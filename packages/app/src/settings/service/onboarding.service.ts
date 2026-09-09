import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { getLocales } from 'expo-localization';

import { getErrorMessage, isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { accountRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { accountService } from '../../account/service/account.service';
import { i18nGetOSLocale } from '../../i18n/util/i18n.util';
import { DEFAULT_INSTRUMENT } from '../constants/default-instrument.constant';
import { updateSettingsMutation } from '../mutation/update-settings.mutation';

class OnboardingService {
    private provisioningPromise: Promise<boolean> | null = null;

    @Log(
        cashAccountTitle => `enter cashAccountTitle="${cashAccountTitle}"`,
        (result, cashAccountTitle) => `done didProvision=${result} cashAccountTitle="${cashAccountTitle}"`,
        (error, cashAccountTitle) => `throw cashAccountTitle="${cashAccountTitle}" error=${getErrorMessage(error)}`
    )
    async provisionFirstAccount(cashAccountTitle: string): Promise<boolean> {
        this.provisioningPromise ??= this.runProvisioning(cashAccountTitle).finally(() => {
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

    private async runProvisioning(cashAccountTitle: string): Promise<boolean> {
        const [{ count }] = await accountRepository.count();

        if (isPositiveNumber(count)) {
            return false;
        }

        const instrumentId = await this.resolveDeviceInstrumentId();

        await accountService.create({
            type: AccountTypeEnum.CASH,
            title: cashAccountTitle,
            currentBalance: 0,
            icon: UserIconNameEnum.Wallet,
            includeInNetWorth: true,
            instrumentId
        });

        await updateSettingsMutation({ defaultInstrumentId: instrumentId, language: i18nGetOSLocale() });

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

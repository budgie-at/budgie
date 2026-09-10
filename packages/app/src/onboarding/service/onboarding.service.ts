import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { getLocales } from 'expo-localization';

import { getErrorMessage, isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

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

    private initializationPromise: Promise<void> | null = null;

    @Log('enter', result => `done shouldStart=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async shouldStart(): Promise<boolean> {
        const [{ count }] = await accountRepository.count();

        return !isPositiveNumber(count);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async initializeLocale(): Promise<void> {
        this.initializationPromise ??= this.runInitializeLocale().finally(() => {
            this.initializationPromise = null;
        });

        return this.initializationPromise;
    }

    @Log(
        accounts => `enter accountCount=${accounts.length}`,
        (_result, accounts) => `done accountCount=${accounts.length}`,
        (error, accounts) => `throw accountCount=${accounts.length} error=${getErrorMessage(error)}`
    )
    async provisionAccounts(accounts: OnboardingAccountInputInterface[]): Promise<void> {
        const { defaultInstrumentId } = await settingsRepository.getSettings();
        const instrumentId = defaultInstrumentId ?? DEFAULT_INSTRUMENT.id;
        const existingAccounts = await accountRepository.getAllActiveAccounts();
        const existingTypes = new Set(existingAccounts.map(existingAccount => existingAccount.type));
        const accountsToCreate = accounts.filter(account => !existingTypes.has(account.type));

        await accountsToCreate.reduce(
            (previousAccountPromise, account) => previousAccountPromise.then(() => this.createOnboardingAccount(account, instrumentId)),
            Promise.resolve()
        );
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

    private async createOnboardingAccount(account: OnboardingAccountInputInterface, instrumentId: number): Promise<void> {
        await accountService.create({
            type: account.type,
            title: account.title,
            currentBalance: 0,
            icon: OnboardingService.ONBOARDING_ACCOUNT_ICON[account.type] ?? UserIconNameEnum.Wallet,
            includeInNetWorth: true,
            instrumentId
        });
    }

    private async runInitializeLocale(): Promise<void> {
        const language = i18nGetOSLocale();
        const instrumentId = await this.resolveDeviceInstrumentId();

        await updateSettingsMutation({ defaultInstrumentId: instrumentId, language });
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

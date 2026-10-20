import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { useSearchAccountsSortedQuery } from '../../../account/query/use-search-accounts-sorted.query';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingFileState } from '../../hook/use-onboarding-file-state.hook';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingService } from '../../service/onboarding.service';
import { OnboardingAccountTile } from '../onboarding-account-tile/onboarding-account-tile';
import { OnboardingCurrencyRow } from '../onboarding-currency-row/onboarding-currency-row';
import { OnboardingStepIntro } from '../onboarding-step-intro/onboarding-step-intro';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingAccountsSelector } from './onboarding-accounts.selector';

import type { OnboardingAccountOptionInterface } from '../../interface/onboarding-account-option.interface';

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export const OnboardingAccounts = () => {
    const { t } = useLingui();

    const [selectedTypes, setSelectedTypes] = useState<ReadonlySet<AccountTypeEnum>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    const { goToStep, completeOnboarding } = useOnboardingNavigation();
    const { accounts } = useSearchAccountsSortedQuery();
    const { state, isSealed } = useOnboardingFileState();

    const accountOptions: readonly OnboardingAccountOptionInterface[] = [
        { type: AccountTypeEnum.CASH, icon: UserIconNameEnum.Wallet, title: t`Cash` },
        { type: AccountTypeEnum.BANK, icon: UserIconNameEnum.Landmark, title: t`Bank account` },
        { type: AccountTypeEnum.SAVINGS, icon: UserIconNameEnum.PiggyBank, title: t`Savings` },
        { type: AccountTypeEnum.DEPOSIT, icon: UserIconNameEnum.Vault, title: t`Deposits` },
        { type: AccountTypeEnum.CRYPTO, icon: UserIconNameEnum.Bitcoin, title: t`Crypto` },
        { type: AccountTypeEnum.STOCKS, icon: UserIconNameEnum.ChartLine, title: t`Stocks` },
        { type: AccountTypeEnum.DEBT, icon: UserIconNameEnum.HandCoins, title: t`Debts and loans` }
    ];

    const existingTypes = new Set(accounts.map(account => account.type));
    const isTypeSelected = (type: AccountTypeEnum) => selectedTypes.has(type) || existingTypes.has(type);
    const newOptions = accountOptions.filter(option => selectedTypes.has(option.type) && !existingTypes.has(option.type));
    const newAccountCount = newOptions.length;
    const hasExistingAccounts = isPositiveNumber(existingTypes.size);

    const handleToggleType = (type: AccountTypeEnum) => {
        if (existingTypes.has(type)) {
            return;
        }

        setSelectedTypes(currentTypes => {
            const nextTypes = new Set(currentTypes);

            if (nextTypes.has(type)) {
                nextTypes.delete(type);
            } else {
                nextTypes.add(type);
            }

            return nextTypes;
        });
    };

    const handleAddPress = () => {
        setIsSaving(true);
        appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(OnboardingService, onboardingService => onboardingService.provisionAccounts(newOptions)).pipe(
                    Effect.andThen(Effect.sync(() => void goToStep(OnboardingStepEnum.BALANCES))),
                    Effect.ensuring(Effect.sync(() => void setIsSaving(false)))
                )
            )
        );
    };

    const addLabel = isPositiveNumber(newAccountCount)
        ? t({ message: plural(newAccountCount, { one: 'Add # account', other: 'Add # accounts' }) })
        : t`Continue`;
    const isAddDisabled = !isPositiveNumber(newAccountCount) && !hasExistingAccounts;

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.ACCOUNTS}
            fileState={state}
            isFileSealed={isSealed}
            footer={
                <>
                    <Button
                        testID={OnboardingAccountsSelector.AddButton}
                        variant="cta"
                        content={addLabel}
                        disabled={isAddDisabled}
                        isLoading={isSaving}
                        onPress={handleAddPress}
                    />
                    <Button
                        testID={OnboardingAccountsSelector.LeaveEmptyButton}
                        variant="ghost"
                        content={t`Leave it empty for now`}
                        onPress={completeOnboarding}
                    />
                </>
            }
        >
            <OnboardingStepIntro title={t`What goes inside?`} description={t`Each one becomes an account. Rename or remove them later.`} />

            <View className="gap-y-xl">
                <View className="flex-row flex-wrap gap-lg">
                    {accountOptions.map(option => (
                        <OnboardingAccountTile
                            key={option.type}
                            testID={OnboardingAccountsSelector.Option(option.type)}
                            option={option}
                            isSelected={isTypeSelected(option.type)}
                            onToggle={handleToggleType}
                        />
                    ))}
                </View>

                <OnboardingCurrencyRow />
            </View>
        </OnboardingStepLayout>
    );
};

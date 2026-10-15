import { AccountTypeEnum, ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { useSearchAccountsSortedQuery } from '../../../account/query/use-search-accounts-sorted.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingFileState } from '../../hook/use-onboarding-file-state.hook';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingService } from '../../service/onboarding.service';
import { OnboardingBalanceRow } from '../onboarding-balance-row/onboarding-balance-row';
import { OnboardingOptionRow } from '../onboarding-option-row/onboarding-option-row';
import { OnboardingStepIntro } from '../onboarding-step-intro/onboarding-step-intro';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingBalancesSelector } from './onboarding-balances.selector';

const MANUAL_BALANCE_TYPES: ReadonlySet<AccountTypeEnum> = new Set([
    AccountTypeEnum.CASH,
    AccountTypeEnum.BANK,
    AccountTypeEnum.SAVINGS,
    AccountTypeEnum.DEPOSIT,
    AccountTypeEnum.CRYPTO,
    AccountTypeEnum.STOCKS
]);

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export const OnboardingBalances = () => {
    const { t } = useLingui();

    const [balances, setBalances] = useState<Readonly<Record<number, number>>>({});
    const [isSaving, setIsSaving] = useState(false);

    const { goToStep } = useOnboardingNavigation();
    const { accounts } = useSearchAccountsSortedQuery();
    const { defaultInstrument } = useSettingsContext();
    const { state, isSealed } = useOnboardingFileState();

    const manualAccounts = accounts.filter(account => MANUAL_BALANCE_TYPES.has(account.type));
    const enteredBalances = manualAccounts
        .filter(account => (balances[account.id] ?? 0) !== 0)
        .map(account => ({ account, balance: balances[account.id] ?? 0 }));

    const handleBalanceChange = (accountId: number, value: number) => {
        setBalances(currentBalances => ({ ...currentBalances, [accountId]: value }));
    };

    const handleLaterPress = () => void goToStep(OnboardingStepEnum.AI);

    const handleSavePress = () => {
        setIsSaving(true);
        appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(OnboardingService, onboardingService => onboardingService.saveBalances(enteredBalances)).pipe(
                    Effect.andThen(Effect.sync(() => void goToStep(OnboardingStepEnum.AI))),
                    Effect.ensuring(Effect.sync(() => void setIsSaving(false)))
                )
            )
        );
    };

    const handleMonobankPress = () =>
        void router.push({ pathname: '/create-account/[type]', params: { type: ExternalSourceEnum.MONOBANK } });

    const handleStatementPress = () => {
        Alert.alert(t`Which bank is the statement from?`, t`Budgie reads these statements on this phone.`, [
            {
                text: t`Privatbank (XLSX)`,
                onPress: () => void router.push({ pathname: '/create-account/[type]', params: { type: ExternalSourceEnum.PRIVATBANK } })
            },
            {
                text: t`Erste Bank (PDF)`,
                onPress: () => void router.push({ pathname: '/create-account/[type]', params: { type: ExternalSourceEnum.ERSTE } })
            },
            { text: t`Cancel`, style: 'cancel' }
        ]);
    };

    const hasManualAccounts = isNotEmptyArray(manualAccounts);
    const isSaveDisabled = !isNotEmptyArray(enteredBalances);

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.BALANCES}
            fileState={state}
            isFileSealed={isSealed}
            footer={
                <>
                    <Button
                        testID={OnboardingBalancesSelector.SaveButton}
                        variant="cta"
                        content={t`Save balances`}
                        disabled={isSaveDisabled}
                        isLoading={isSaving}
                        onPress={handleSavePress}
                    />
                    <Button
                        testID={OnboardingBalancesSelector.LaterButton}
                        variant="ghost"
                        content={t`Add balances later`}
                        onPress={handleLaterPress}
                    />
                </>
            }
        >
            <OnboardingStepIntro title={t`What's in them today?`} description={t`A rough number is fine. You can correct it any time.`} />

            {hasManualAccounts ? (
                <View className="gap-y-md">
                    {manualAccounts.map(account => (
                        <OnboardingBalanceRow
                            key={account.id}
                            account={account}
                            currencySymbol={defaultInstrument.symbol}
                            value={balances[account.id] ?? 0}
                            onChangeValue={handleBalanceChange}
                        />
                    ))}
                </View>
            ) : null}

            <View className="gap-y-md">
                <Text className="text-xs uppercase text-secondary-foreground">
                    <Trans>Or fill it from</Trans>
                </Text>

                <OnboardingOptionRow
                    testID={OnboardingBalancesSelector.MonobankOption}
                    icon={UserIconNameEnum.Landmark}
                    title={t`Monobank`}
                    description={t`Your token is stored in Budgie's file and only ever sent to Monobank.`}
                    isSelected={false}
                    onPress={handleMonobankPress}
                />
                <OnboardingOptionRow
                    testID={OnboardingBalancesSelector.StatementOption}
                    icon={UserIconNameEnum.FileText}
                    title={t`A bank statement (PDF or XLSX)`}
                    description={t`Read on this phone, then you can delete it.`}
                    isSelected={false}
                    onPress={handleStatementPress}
                />
            </View>
        </OnboardingStepLayout>
    );
};

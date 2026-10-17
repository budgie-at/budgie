import { AccountTypeEnum, ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { MANUAL_BALANCE_ACCOUNT_TYPES } from '../../../account/constant/manual-balance-account-types.constant';
import { useSearchAccountsSortedQuery } from '../../../account/query/use-search-accounts-sorted.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingFileState } from '../../hook/use-onboarding-file-state.hook';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingService } from '../../service/onboarding.service';
import { OnboardingBalanceRow } from '../onboarding-balance-row/onboarding-balance-row';
import { OnboardingSourceRow } from '../onboarding-source-row/onboarding-source-row';
import { OnboardingStepIntro } from '../onboarding-step-intro/onboarding-step-intro';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingBalancesSelector } from './onboarding-balances.selector';

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export const OnboardingBalances = () => {
    const { t } = useLingui();

    const [balances, setBalances] = useState<Readonly<Record<number, number>>>({});
    const [isSaving, setIsSaving] = useState(false);

    const { goToStep } = useOnboardingNavigation();
    const { accounts } = useSearchAccountsSortedQuery();
    const { defaultInstrument } = useSettingsContext();
    const { state, isSealed } = useOnboardingFileState();

    const manualAccounts = accounts.filter(account => MANUAL_BALANCE_ACCOUNT_TYPES.has(account.type));
    const enteredBalances = manualAccounts
        .filter(account => (balances[account.id] ?? 0) !== 0)
        .map(account => ({ accountId: account.id, balance: balances[account.id] ?? 0 }));

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
    const sourcesAccountId = manualAccounts.find(account => account.type === AccountTypeEnum.BANK)?.id;
    const hasStandaloneSources = !isDefined(sourcesAccountId);
    const isSaveDisabled = !isNotEmptyArray(enteredBalances);

    const monobankAccountCount = accounts.filter(account => account.externalSource === ExternalSourceEnum.MONOBANK).length;
    const isMonobankConnected = isPositiveNumber(monobankAccountCount);
    const monobankIcon = isMonobankConnected ? UserIconNameEnum.CircleCheck : UserIconNameEnum.Link;
    const monobankIconClassName = isMonobankConnected ? 'text-positive-foreground' : 'text-violet-foreground';
    const monobankTitle = isMonobankConnected ? t`Monobank connected` : t`Monobank`;
    const monobankDescription = isMonobankConnected
        ? t({
              message: plural(monobankAccountCount, {
                  one: '# account. Balances come straight from the bank.',
                  other: '# accounts. Balances come straight from the bank.'
              })
          })
        : t`Your token is stored in Budgie's file and only ever sent to Monobank.`;

    const sources = (
        <View className="gap-y-md">
            <Text className="text-secondary-foreground text-xs">
                <Trans>Or fill it from</Trans>
            </Text>

            <OnboardingSourceRow
                testID={OnboardingBalancesSelector.MonobankOption}
                icon={monobankIcon}
                iconClassName={monobankIconClassName}
                title={monobankTitle}
                description={monobankDescription}
                onPress={handleMonobankPress}
            />
            <OnboardingSourceRow
                testID={OnboardingBalancesSelector.StatementOption}
                icon={UserIconNameEnum.FileText}
                iconClassName="text-cyan-foreground"
                title={t`A bank statement (PDF or XLSX)`}
                description={t`Read on this phone, then you can delete it.`}
                onPress={handleStatementPress}
            />
        </View>
    );

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
                <View className="gap-y-lg">
                    {manualAccounts.map(account => (
                        <OnboardingBalanceRow
                            key={account.id}
                            account={account}
                            currencySymbol={defaultInstrument.symbol}
                            value={balances[account.id] ?? 0}
                            onChangeValue={handleBalanceChange}
                        >
                            {account.id === sourcesAccountId ? sources : null}
                        </OnboardingBalanceRow>
                    ))}
                </View>
            ) : null}

            {hasStandaloneSources ? sources : null}
        </OnboardingStepLayout>
    );
};

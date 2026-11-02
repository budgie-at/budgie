import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { MANUAL_BALANCE_ACCOUNT_TYPES } from '../../../account/constant/manual-balance-account-types.constant';
import { useSearchAccountsSortedQuery } from '../../../account/query/use-search-accounts-sorted.query';
import { ONBOARDING_ACCOUNT_OPTIONS } from '../../constant/onboarding-account-options.constant';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingFileState } from '../../hook/use-onboarding-file-state.hook';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingService } from '../../service/onboarding.service';
import { OnboardingBalanceRow } from '../onboarding-balance-row/onboarding-balance-row';
import { OnboardingFooterAction } from '../onboarding-footer-action/onboarding-footer-action';
import { OnboardingStepIntro } from '../onboarding-step-intro/onboarding-step-intro';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingBalancesSelector } from './onboarding-balances.selector';

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export const OnboardingBalances = () => {
    const { t } = useLingui();

    const [balances, setBalances] = useState<Readonly<Record<number, number>>>({});
    const [isSaving, setIsSaving] = useState(false);

    const { goToStep } = useOnboardingNavigation();
    const { accounts, isLoading } = useSearchAccountsSortedQuery();
    const { state, lock } = useOnboardingFileState();

    const accountTypeOrder = ONBOARDING_ACCOUNT_OPTIONS.map(option => option.type);
    const manualAccounts = accounts
        .filter(account => MANUAL_BALANCE_ACCOUNT_TYPES.has(account.type))
        .sort((left, right) => accountTypeOrder.indexOf(left.type) - accountTypeOrder.indexOf(right.type));
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

    const monobankAccountCount = accounts.filter(account => account.externalSource === ExternalSourceEnum.MONOBANK).length;
    const isMonobankConnected = isPositiveNumber(monobankAccountCount);
    const monobankIcon = isMonobankConnected ? UserIconNameEnum.CircleCheck : UserIconNameEnum.Link;
    const monobankIconClassName = isMonobankConnected ? 'text-positive-foreground' : 'text-secondary-foreground';
    const monobankTitle = isMonobankConnected ? t`Monobank connected` : t`Monobank`;
    const monobankDescription = isMonobankConnected
        ? t({
              message: plural(monobankAccountCount, {
                  one: '# account. Balances come straight from the bank.',
                  other: '# accounts. Balances come straight from the bank.'
              })
          })
        : t`Token stays in Budgie’s file. Sent only to Monobank.`;

    const statementAccountCount = accounts.filter(
        account => account.externalSource === ExternalSourceEnum.PRIVATBANK || account.externalSource === ExternalSourceEnum.ERSTE
    ).length;
    const isStatementImported = isPositiveNumber(statementAccountCount);
    const statementIcon = isStatementImported ? UserIconNameEnum.CircleCheck : UserIconNameEnum.FileText;
    const statementIconClassName = isStatementImported ? 'text-positive-foreground' : 'text-secondary-foreground';
    const statementTitle = isStatementImported ? t`Statement imported` : t`Bank statement`;
    const statementDescription = isStatementImported
        ? t({
              message: plural(statementAccountCount, {
                  one: '# account. Balances come from the statement.',
                  other: '# accounts. Balances come from the statement.'
              })
          })
        : t`Erste (PDF) or Privatbank (XLSX), read on this phone.`;
    const isSaveDisabled = !isNotEmptyArray(enteredBalances) && !isMonobankConnected && !isStatementImported;
    const saveLabel = isSaveDisabled ? t`Enter a balance to save` : t`Save balances`;

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.BALANCES}
            fileState={state}
            fileLock={lock}
            isLoading={isLoading}
            footer={
                <>
                    <PillButton
                        testID={OnboardingBalancesSelector.SaveButton}
                        label={saveLabel}
                        isDisabled={isSaveDisabled}
                        isLoading={isSaving}
                        onPress={handleSavePress}
                    />
                    <OnboardingFooterAction
                        testID={OnboardingBalancesSelector.LaterButton}
                        label={t`Add balances later`}
                        onPress={handleLaterPress}
                    />
                </>
            }
        >
            <OnboardingStepIntro title={t`What’s in them today?`} description={t`A rough number is fine. Fix it any time.`} />

            {hasManualAccounts ? (
                <GroupedListSection title={t`Accounts`}>
                    {manualAccounts.map(account => (
                        <OnboardingBalanceRow
                            key={account.id}
                            account={account}
                            value={balances[account.id] ?? 0}
                            onChangeValue={handleBalanceChange}
                        />
                    ))}
                </GroupedListSection>
            ) : null}

            <GroupedListSection title={t`Or import from`}>
                <GroupedListRow
                    testID={OnboardingBalancesSelector.MonobankOption}
                    left={<GroupedListIcon icon={monobankIcon} iconClassName={monobankIconClassName} />}
                    title={monobankTitle}
                    subtitle={monobankDescription}
                    onPress={handleMonobankPress}
                />
                <GroupedListRow
                    testID={OnboardingBalancesSelector.StatementOption}
                    left={<GroupedListIcon icon={statementIcon} iconClassName={statementIconClassName} />}
                    title={statementTitle}
                    subtitle={statementDescription}
                    onPress={handleStatementPress}
                />
            </GroupedListSection>
        </OnboardingStepLayout>
    );
};

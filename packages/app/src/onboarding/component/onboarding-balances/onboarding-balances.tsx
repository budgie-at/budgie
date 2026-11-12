import { ExternalSourceEnum, UserIconNameEnum, logAndContinue } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { MANUAL_BALANCE_ACCOUNT_TYPES } from '../../../account/constant/manual-balance-account-types.constant';
import { useSearchAccountsSortedQuery } from '../../../account/query/use-search-accounts-sorted.query';
import { ONBOARDING_ACCOUNT_OPTIONS } from '../../constant/onboarding-account-options.constant';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingFileState } from '../../hook/use-onboarding-file-state.hook';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingService } from '../../service/onboarding.service';
import { OnboardingBalanceRow } from '../onboarding-balance-row/onboarding-balance-row';
import { OnboardingFooterAction } from '../onboarding-footer-action/onboarding-footer-action';
import { OnboardingImportRow } from '../onboarding-import-row/onboarding-import-row';
import { OnboardingKeyboardControls } from '../onboarding-keyboard-controls/onboarding-keyboard-controls';
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

    const handleEuBanksPress = () =>
        void router.push({ pathname: '/create-account/[type]', params: { type: ExternalSourceEnum.ENABLE_BANKING } });

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

    const hasAccounts = isNotEmptyArray(accounts);
    const hasManualAccounts = isNotEmptyArray(manualAccounts);

    const countAccountsFrom = (sources: readonly ExternalSourceEnum[]) =>
        accounts.filter(account => isDefined(account.externalSource) && sources.includes(account.externalSource)).length;
    const describeBankAccounts = (count: number) =>
        t({
            message: plural(count, {
                one: '# account. Balances come straight from the bank.',
                other: '# accounts. Balances come straight from the bank.'
            })
        });

    const monobankAccountCount = countAccountsFrom([ExternalSourceEnum.MONOBANK]);
    const isMonobankConnected = isPositiveNumber(monobankAccountCount);
    const monobankTitle = isMonobankConnected ? t`Monobank connected` : t`Monobank`;
    const monobankDescription = isMonobankConnected
        ? describeBankAccounts(monobankAccountCount)
        : t`Token stays on this phone, sent only to Monobank.`;

    const euBankAccountCount = countAccountsFrom([ExternalSourceEnum.ENABLE_BANKING]);
    const isEuBankConnected = isPositiveNumber(euBankAccountCount);
    const euBankTitle = isEuBankConnected ? t`EU bank connected` : t`EU banks`;
    const euBankDescription = isEuBankConnected
        ? describeBankAccounts(euBankAccountCount)
        : t`Trade Republic, N26 and other EU banks, read-only.`;

    const statementAccountCount = countAccountsFrom([ExternalSourceEnum.PRIVATBANK, ExternalSourceEnum.ERSTE]);
    const isStatementImported = isPositiveNumber(statementAccountCount);
    const statementTitle = isStatementImported ? t`Statement imported` : t`Bank statement`;
    const statementDescription = isStatementImported
        ? t({
              message: plural(statementAccountCount, {
                  one: '# account. Balances come from the statement.',
                  other: '# accounts. Balances come from the statement.'
              })
          })
        : t`Erste (PDF) or Privatbank (XLSX), read on this phone.`;
    const hasImportedAccounts = isMonobankConnected || isEuBankConnected || isStatementImported;
    const isSaveDisabled = hasAccounts && !isNotEmptyArray(enteredBalances) && !hasImportedAccounts;
    const balancesLabel = isSaveDisabled ? t`Enter a balance to save` : t`Save balances`;
    const saveLabel = hasAccounts ? balancesLabel : t`Continue without accounts`;
    const handleContinuePress = hasAccounts ? handleSavePress : handleLaterPress;
    const title = hasAccounts ? t`What’s in them today?` : t`No accounts yet`;
    const description = hasAccounts ? t`A rough number is fine. Fix it any time.` : t`Import accounts now, or add them later in Budgie.`;
    const importTitle = hasManualAccounts ? t`Or import from` : t`Import`;

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.BALANCES}
            fileState={state}
            fileLock={lock}
            isLoading={isLoading}
            footer={
                <>
                    <OnboardingKeyboardControls />
                    <PillButton
                        testID={OnboardingBalancesSelector.SaveButton}
                        label={saveLabel}
                        isDisabled={isSaveDisabled}
                        isLoading={isSaving}
                        onPress={handleContinuePress}
                    />
                    {hasAccounts ? (
                        <OnboardingFooterAction
                            testID={OnboardingBalancesSelector.LaterButton}
                            label={t`Add balances later`}
                            onPress={handleLaterPress}
                        />
                    ) : null}
                </>
            }
        >
            <OnboardingStepIntro title={title} description={description} />

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

            <GroupedListSection title={importTitle}>
                <OnboardingImportRow
                    testID={OnboardingBalancesSelector.MonobankOption}
                    icon={UserIconNameEnum.Link}
                    isImported={isMonobankConnected}
                    title={monobankTitle}
                    subtitle={monobankDescription}
                    onPress={handleMonobankPress}
                />
                <OnboardingImportRow
                    testID={OnboardingBalancesSelector.EuBanksOption}
                    icon={UserIconNameEnum.Landmark}
                    isImported={isEuBankConnected}
                    title={euBankTitle}
                    subtitle={euBankDescription}
                    onPress={handleEuBanksPress}
                />
                <OnboardingImportRow
                    testID={OnboardingBalancesSelector.StatementOption}
                    icon={UserIconNameEnum.FileText}
                    isImported={isStatementImported}
                    title={statementTitle}
                    subtitle={statementDescription}
                    onPress={handleStatementPress}
                />
            </GroupedListSection>
        </OnboardingStepLayout>
    );
};

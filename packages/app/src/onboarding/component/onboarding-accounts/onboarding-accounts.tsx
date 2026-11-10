import { AccountTypeEnum, logAndContinue } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { useSearchAccountsSortedQuery } from '../../../account/query/use-search-accounts-sorted.query';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { ONBOARDING_ACCOUNT_OPTIONS } from '../../constant/onboarding-account-options.constant';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingFileState } from '../../hook/use-onboarding-file-state.hook';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingService } from '../../service/onboarding.service';
import { OnboardingAccountRow } from '../onboarding-account-row/onboarding-account-row';
import { OnboardingCurrencyRow } from '../onboarding-currency-row/onboarding-currency-row';
import { OnboardingFooterAction } from '../onboarding-footer-action/onboarding-footer-action';
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
    const { accounts, isLoading } = useSearchAccountsSortedQuery();
    const { state, lock } = useOnboardingFileState();
    const currencyCode = useAtomValue(defaultInstrumentAtom).code;

    const accountOptions: readonly OnboardingAccountOptionInterface[] = ONBOARDING_ACCOUNT_OPTIONS.map(option => ({
        ...option,
        title: t(option.title)
    }));

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

    const isAddDisabled = !isPositiveNumber(newAccountCount) && !hasExistingAccounts;
    const enabledAddLabel = isPositiveNumber(newAccountCount)
        ? t({ message: plural(newAccountCount, { one: `Add # account in ${currencyCode}`, other: `Add # accounts in ${currencyCode}` }) })
        : t`Continue`;
    const addLabel = isAddDisabled ? t`Choose at least one` : enabledAddLabel;

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.ACCOUNTS}
            fileState={state}
            fileLock={lock}
            isLoading={isLoading}
            footer={
                <>
                    <PillButton
                        testID={OnboardingAccountsSelector.AddButton}
                        label={addLabel}
                        isDisabled={isAddDisabled}
                        isLoading={isSaving}
                        onPress={handleAddPress}
                    />
                    <OnboardingFooterAction
                        testID={OnboardingAccountsSelector.LeaveEmptyButton}
                        label={t`Leave it empty for now`}
                        onPress={completeOnboarding}
                    />
                </>
            }
        >
            <OnboardingStepIntro title={t`What goes inside?`} description={t`Choose your accounts. Rename them later.`} />

            <OnboardingCurrencyRow />

            <GroupedListSection>
                {accountOptions.map(option => (
                    <OnboardingAccountRow
                        key={option.type}
                        testID={OnboardingAccountsSelector.Option(option.type)}
                        option={option}
                        isSelected={isTypeSelected(option.type)}
                        isLocked={existingTypes.has(option.type)}
                        onToggle={handleToggleType}
                    />
                ))}
            </GroupedListSection>
        </OnboardingStepLayout>
    );
};

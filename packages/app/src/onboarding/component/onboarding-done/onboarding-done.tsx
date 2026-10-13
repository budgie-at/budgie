import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { useHomePageDataQuery } from '../../../account/query/use-home-page-data.query';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useGetBankIntegrationCountQuery } from '../../../sync/query/use-get-bank-integration-count.query';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { OnboardingService } from '../../service/onboarding.service';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';
import { OnboardingSuccessRow } from '../onboarding-success-row/onboarding-success-row';

import { OnboardingDoneSelector } from './onboarding-done.selector';

export const OnboardingDone = () => {
    const { t } = useLingui();
    const { accounts, balanceSummary } = useHomePageDataQuery();
    const { budget } = useGetActiveBudgetQuery();
    const bankIntegrationCount = useGetBankIntegrationCountQuery();
    const isPinEnabled = useSetting('isPinEnabled');
    const isAiEnabled = useSetting('isAiEnabled');
    const { defaultInstrument } = useSettingsContext();

    const handlePrimary = () => {
        appRuntime.runFork(logAndContinue(Effect.flatMap(OnboardingService, onboardingService => onboardingService.complete())));
    };

    const checklistItems = [
        ...(isPositiveNumber(accounts.length)
            ? [
                  {
                      key: 'accounts',
                      label: t({ message: plural(accounts.length, { one: '# account created', other: '# accounts created' }) })
                  }
              ]
            : []),
        ...(isPositiveNumber(bankIntegrationCount) ? [{ key: 'bank', label: t`Bank connected` }] : []),
        ...(isDefined(budget) ? [{ key: 'budget', label: t`Monthly budget set` }] : []),
        ...(isPinEnabled ? [{ key: 'pin', label: t`App locked and encrypted` }] : []),
        ...(isAiEnabled ? [{ key: 'ai', label: t`On-device AI enabled` }] : [])
    ];
    const hasCompletedAnything = isNotEmptyArray(checklistItems);

    const checklistContent = hasCompletedAnything ? (
        <View className="gap-y-md">
            {checklistItems.map(item => (
                <OnboardingSuccessRow key={item.key} label={item.label} testID={OnboardingDoneSelector.SuccessRow(item.key)} />
            ))}
        </View>
    ) : (
        <Text className="text-secondary-foreground text-md text-center">
            <Trans>You can always finish these steps later. Budgie&apos;s ready whenever you are.</Trans>
        </Text>
    );

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.DONE}
            title={t`You're all set`}
            description={t`Budgie is ready to go. You can revisit any of these steps later from Settings.`}
            primaryLabel={t`Start using Budgie`}
            onPrimary={handlePrimary}
        >
            <View className="items-center mb-5xl">
                <Text className="text-xs text-secondary-foreground mb-md">
                    <Trans>YOUR NET WORTH</Trans>
                </Text>
                <ProtectedMoney
                    testID={OnboardingDoneSelector.NetWorthValue}
                    minFontSize={32}
                    maxFontSize={64}
                    instrumentSymbol={defaultInstrument.symbol}
                >
                    {balanceSummary.netWorth}
                </ProtectedMoney>
            </View>

            {checklistContent}
        </OnboardingStepLayout>
    );
};

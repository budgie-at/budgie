import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { useCurrencySelectorModal } from '../../../@generic/context/currency-selector-modal.context';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { useSearchAccountsSortedQuery } from '../../../account/query/use-search-accounts-sorted.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { updateSettingsMutation } from '../../../settings/mutation/update-settings.mutation';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingTrackOptionInterface } from '../../interface/onboarding-track-option.interface';
import { OnboardingService } from '../../service/onboarding.service';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';
import { OnboardingTrackOptionRow } from '../onboarding-track-option-row/onboarding-track-option-row';

import { OnboardingTrackSelector } from './onboarding-track.selector';

export const OnboardingTrack = () => {
    const { t } = useLingui();
    const { goToNextStep } = useOnboardingNavigation();
    const { defaultInstrument } = useSettingsContext();
    const [openCurrencySelector] = useCurrencySelectorModal();
    const [manualToggles, setManualToggles] = useState<Partial<Record<AccountTypeEnum, boolean>>>({});
    const { accounts } = useSearchAccountsSortedQuery();

    const isTypeSelected = (type: AccountTypeEnum) => manualToggles[type] ?? accounts.some(account => account.type === type);

    const trackOptions: readonly OnboardingTrackOptionInterface[] = [
        { type: AccountTypeEnum.CASH, icon: UserIconNameEnum.Wallet, title: t`Cash` },
        { type: AccountTypeEnum.BANK, icon: UserIconNameEnum.Landmark, title: t`Bank account` },
        { type: AccountTypeEnum.CRYPTO, icon: UserIconNameEnum.Bitcoin, title: t`Crypto` },
        { type: AccountTypeEnum.DEBT, icon: UserIconNameEnum.HandCoins, title: t`Debts & loans` }
    ];

    const handleToggleType = (type: AccountTypeEnum) => {
        setManualToggles(currentToggles => ({ ...currentToggles, [type]: !isTypeSelected(type) }));
    };

    const handleChangeCurrency = async () => {
        const result = await openCurrencySelector({ selectedInstrumentId: defaultInstrument.id });

        if (isDefined(result)) {
            await appRuntime.runPromise(updateSettingsMutation({ defaultInstrumentId: result }));
        }
    };

    const handleChangeCurrencyPress = () => void handleChangeCurrency();
    const defaultInstrumentCode = defaultInstrument.code;
    const isPrimaryDisabled = trackOptions.every(option => !isTypeSelected(option.type)) && isEmptyArray(accounts);

    const handlePrimary = () => {
        appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(OnboardingService, onboardingService =>
                    onboardingService.provisionAccounts(
                        trackOptions
                            .filter(option => isTypeSelected(option.type))
                            .map(option => ({ type: option.type, title: option.title }))
                    )
                ).pipe(Effect.map(() => void goToNextStep(OnboardingStepEnum.TRACK)))
            )
        );
    };

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.TRACK}
            title={t`What do you want to track?`}
            description={t`Pick any. We'll create the accounts for you — rename or remove them later.`}
            primaryLabel={t`Continue`}
            onPrimary={handlePrimary}
            isPrimaryDisabled={isPrimaryDisabled}
        >
            <View className="gap-y-md">
                {trackOptions.map(option => (
                    <OnboardingTrackOptionRow
                        key={option.type}
                        option={option}
                        isSelected={isTypeSelected(option.type)}
                        onToggle={handleToggleType}
                    />
                ))}
            </View>

            <View
                {...testID(OnboardingTrackSelector.Root)}
                className="flex-row items-center justify-between rounded-3xl border border-secondary-corner bg-secondary-background px-3xl py-lg mt-xl"
            >
                <Text className="text-secondary-foreground text-xs">
                    <Trans>Tracking in {defaultInstrumentCode}</Trans>
                </Text>

                <Pressable
                    {...testID(OnboardingTrackSelector.ChangeCurrencyButton)}
                    onPress={handleChangeCurrencyPress}
                    accessibilityLabel={t`Change currency`}
                >
                    <Text className="text-primary text-xs font-semibold">
                        <Trans>Change</Trans>
                    </Text>
                </Pressable>
            </View>
        </OnboardingStepLayout>
    );
};

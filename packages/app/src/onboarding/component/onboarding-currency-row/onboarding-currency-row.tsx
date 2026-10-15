import { Trans, useLingui } from '@lingui/react/macro';
import { Pressable, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useCurrencySelectorModal } from '../../../@generic/context/currency-selector-modal.context';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { updateSettingsMutation } from '../../../settings/mutation/update-settings.mutation';

import { OnboardingCurrencyRowSelector } from './onboarding-currency-row.selector';

export const OnboardingCurrencyRow = () => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const [openCurrencySelector] = useCurrencySelectorModal();

    const handleChangePress = () => {
        openCurrencySelector({ selectedInstrumentId: defaultInstrument.id }, result => {
            if (isDefined(result)) {
                appRuntime.runFork(logAndContinue(updateSettingsMutation({ defaultInstrumentId: result })));
            }
        });
    };

    const currencyName = defaultInstrument.name;

    return (
        <View
            testID={OnboardingCurrencyRowSelector.Root}
            className="flex-row items-center gap-x-xl rounded-[18px] border border-secondary-corner px-3xl py-2xl"
        >
            <Text className="text-secondary-foreground text-sm flex-1">
                <Trans>
                    Main currency: <Text className="text-primary">{currencyName}</Text>, from your phone&apos;s region
                </Trans>
            </Text>

            <Pressable
                testID={OnboardingCurrencyRowSelector.ChangeButton}
                onPress={handleChangePress}
                accessibilityLabel={t`Change currency`}
            >
                <Text className="text-primary text-sm font-semibold">
                    <Trans>Change</Trans>
                </Text>
            </Pressable>
        </View>
    );
};

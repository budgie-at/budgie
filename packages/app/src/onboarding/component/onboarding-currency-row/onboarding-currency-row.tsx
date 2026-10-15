import { Trans, useLingui } from '@lingui/react/macro';
import { Pressable, Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
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
        <Card testID={OnboardingCurrencyRowSelector.Root} variant="secondary" size="md" className="flex-row items-center gap-x-lg">
            <Text className="text-secondary-foreground text-xs flex-1">
                <Trans>
                    Main currency: <Text className="text-primary font-semibold">{currencyName}</Text>, from your phone&apos;s region
                </Trans>
            </Text>

            <Pressable
                testID={OnboardingCurrencyRowSelector.ChangeButton}
                onPress={handleChangePress}
                accessibilityLabel={t`Change currency`}
            >
                <Text className="text-primary text-xs font-semibold">
                    <Trans>Change</Trans>
                </Text>
            </Pressable>
        </Card>
    );
};

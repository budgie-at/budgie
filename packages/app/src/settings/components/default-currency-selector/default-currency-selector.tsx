import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useCurrencySelectorModal } from '../../../@generic/context/currency-selector-modal.context';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { defaultInstrumentAtom } from '../../constants/settings-atoms.constant';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsCard } from '../settings-card/settings-card';

export const DefaultCurrencySelector = () => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const [openCurrencySelector] = useCurrencySelectorModal();
    const { t } = useLingui();

    const handleOpen = () => {
        openCurrencySelector({ selectedInstrumentId: defaultInstrument.id }, result => {
            if (isDefined(result)) {
                appRuntime.runFork(logAndContinue(updateSettingsMutation({ defaultInstrumentId: result })));
            }
        });
    };

    return (
        <SettingsCard
            title={t`Main Currency`}
            description={defaultInstrument.name}
            testID={SettingsPageSelector.MainCurrencyCard(defaultInstrument.code)}
            left={
                <View className="w-10 h-10 rounded-full bg-secondary-foreground/10 justify-center items-center">
                    <Text className="text-primary text-3xl" adjustsFontSizeToFit numberOfLines={1}>
                        {defaultInstrument.symbol}
                    </Text>
                </View>
            }
            onPress={handleOpen}
        />
    );
};

import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { SettingsPageSelectors } from '../../../@e2e/selectors/settings-page.selector';
import { useCurrencySelectorModal } from '../../../@generic/context/currency-selector-modal.context';
import { useSettingsContext } from '../../context/settings.context';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsCard } from '../settings-card/settings-card';

export const DefaultCurrencySelector = () => {
    const { defaultInstrument } = useSettingsContext();
    const [openCurrencySelector] = useCurrencySelectorModal();
    const { t } = useLingui();

    const handleOpen = async () => {
        const result = await openCurrencySelector({ selectedInstrumentId: defaultInstrument.id });
        if (isDefined(result)) {
            await updateSettingsMutation({ defaultInstrumentId: result });
        }
    };

    return (
        <SettingsCard
            title={t`Main Currency`}
            description={defaultInstrument.name}
            testID={SettingsPageSelectors.MainCurrencyCard}
            descriptionTestID={SettingsPageSelectors.MainCurrencyValue(defaultInstrument.code)}
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

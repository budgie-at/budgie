import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Text, View } from 'react-native';

import { CurrencySelectorBottomSheet } from '../../../@generic/component/currency-selector-bottom-sheet/currency-selector-bottom-sheet';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useSettingsContext } from '../../context/settings.context';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsCard } from '../settings-card/settings-card';

export const DefaultCurrencySelector = () => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { defaultInstrument } = useSettingsContext();
    const { t } = useLingui();

    const updateDefaultInstrument = async (instrumentId: number) => {
        await updateSettingsMutation({
            defaultInstrumentId: instrumentId
        });
    };

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <SettingsCard
                title={t`Main Currency`}
                description={defaultInstrument.name}
                left={
                    <View className="w-10 h-10 rounded-full bg-secondary-foreground/10 justify-center items-center">
                        <Text className="text-primary text-3xl" adjustsFontSizeToFit numberOfLines={1}>
                            {defaultInstrument.symbol}
                        </Text>
                    </View>
                }
                onPress={handleOpen}
            />

            <CurrencySelectorBottomSheet selectedInstrumentId={defaultInstrument.id} onSelect={updateDefaultInstrument} ref={ref} />
        </>
    );
};

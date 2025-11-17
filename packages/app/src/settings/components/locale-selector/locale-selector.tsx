import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { LocaleSelectorBottomSheet } from '../../../i18n/components/locale-selector-bottom-sheet/locale-selector-bottom-sheet';
import { LOCALES } from '../../../i18n/constant/locales.constant';
import { useSettingsContext } from '../../context/settings.context';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsCard } from '../settings-card/settings-card';

export const LocaleSelector = () => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { settings } = useSettingsContext();
    const { i18n, t } = useLingui();

    const selectedLocale = LOCALES.find(({ languageTag }) => languageTag === settings.locale);

    const updateDefaultInstrument = async (locale: string) => {
        await updateSettingsMutation({ locale });
    };

    const handleOpen = () => void ref.current?.open();

    if (!isDefined(selectedLocale)) {
        return null;
    }

    return (
        <>
            <SettingsCard
                right={
                    <View className="ml-auto">
                        <Icon className="text-primary" icon={ICONS.ChevronRight} />
                    </View>
                }
                left={<CircleIcon icon={ICONS.MapPinIcon} variant="warning" size="1_5xl" border={false} />}
                onPress={handleOpen}
                title={t`Locale`}
                description={i18n.t(selectedLocale.name)}
            />

            <LocaleSelectorBottomSheet locale={settings.locale} onSelect={updateDefaultInstrument} ref={ref} />
        </>
    );
};

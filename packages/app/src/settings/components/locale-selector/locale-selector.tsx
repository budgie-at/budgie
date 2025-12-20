import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { LocaleSelectorBottomSheet } from '../../../i18n/components/locale-selector-bottom-sheet/locale-selector-bottom-sheet';
import { LOCALES } from '../../../i18n/constant/locales.constant';
import { useSettingsContext } from '../../context/settings.context';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { GenericSelectorCard } from '../generic-selector-card/generic-selector-card';

export const LocaleSelector = () => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { settings } = useSettingsContext();
    const { i18n, t } = useLingui();

    const selectedLocale = LOCALES.find(({ languageTag }) => languageTag === settings.locale);

    const updateDefaultInstrument = async (locale: string) => {
        await updateSettingsMutation({ locale });
        i18n.activate(locale);
    };

    const handleOpen = () => void ref.current?.open();

    if (!isDefined(selectedLocale)) {
        return null;
    }

    return (
        <>
            <GenericSelectorCard
                icon="MapPinIcon"
                title={t`Locale`}
                onPress={handleOpen}
                iconVariant="warning"
                description={`${selectedLocale.emoji} ${i18n.t(selectedLocale.name)}`}
            />

            <LocaleSelectorBottomSheet locale={settings.locale} onSelect={updateDefaultInstrument} ref={ref} />
        </>
    );
};

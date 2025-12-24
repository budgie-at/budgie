import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { LocaleSelectorBottomSheet } from '../../../i18n/components/locale-selector-bottom-sheet/locale-selector-bottom-sheet';
import { LOCALES } from '../../../i18n/constant/locales.constant';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { GenericSelectorCard } from '../generic-selector-card/generic-selector-card';

export const LocaleSelector = () => {
    const { i18n, t } = useLingui();
    const locale = useSetting('locale');

    const ref = useRef<BottomSheetInterface | null>(null);

    const selectedLocale = LOCALES.find(({ languageTag }) => languageTag === locale);

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

            <LocaleSelectorBottomSheet locale={locale} onSelect={updateDefaultInstrument} ref={ref} />
        </>
    );
};

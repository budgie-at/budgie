import { LanguageEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { LanguageSelectorBottomSheet } from '../../../i18n/components/language-selector-bottom-sheet/language-selector-bottom-sheet';
import { LANGUAGES } from '../../../i18n/constant/languages.constant';
import { useSettingsContext } from '../../context/settings.context';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { GenericSelectorCard } from '../generic-selector-card/generic-selector-card';

export const LanguageSelector = () => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { settings } = useSettingsContext();
    const { i18n, t } = useLingui();

    const selectedLanguage = LANGUAGES.find(({ code }) => code === settings.language);

    const updateDefaultInstrument = async (language: LanguageEnum) => {
        await updateSettingsMutation({ language });
        i18n.activate(language);
    };

    const handleOpen = () => void ref.current?.open();

    if (!isDefined(selectedLanguage)) {
        return null;
    }

    return (
        <>
            <GenericSelectorCard
                icon="Globe"
                title={t`Language`}
                onPress={handleOpen}
                iconVariant="default"
                description={`${selectedLanguage.emoji} ${i18n.t(selectedLanguage.name)}`}
            />

            <LanguageSelectorBottomSheet language={settings.language} onSelect={updateDefaultInstrument} ref={ref} />
        </>
    );
};

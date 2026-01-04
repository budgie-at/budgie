import { LanguageEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { LanguageSelectorBottomSheet } from '../../../i18n/components/language-selector-bottom-sheet/language-selector-bottom-sheet';
import { LANGUAGES } from '../../../i18n/constant/languages.constant';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsCard } from '../settings-card/settings-card';

export const LanguageSelector = () => {
    const language = useSetting('language');
    const { i18n, t } = useLingui();

    const ref = useRef<BottomSheetInterface | null>(null);

    const selectedLanguage = LANGUAGES.find(({ code }) => code === language);

    const handleLanguageSelect = async (language: LanguageEnum) => {
        await updateSettingsMutation({ language });
        i18n.activate(language);
    };

    const handleOpen = () => void ref.current?.open();

    if (!isDefined(selectedLanguage)) {
        return null;
    }

    return (
        <>
            <SettingsCard
                icon={UserIconNameEnum.Globe}
                variant="default"
                title={t`Language`}
                onPress={handleOpen}
                description={`${selectedLanguage.emoji} ${t(selectedLanguage.name)}`}
            />

            <LanguageSelectorBottomSheet language={language} onSelect={handleLanguageSelect} ref={ref} />
        </>
    );
};

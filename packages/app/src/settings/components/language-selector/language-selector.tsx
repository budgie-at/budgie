import { LanguageEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { Icon } from '../../../@generic/components/icon/icon';
import { LanguageSelectorBottomSheet } from '../../../@generic/components/language-selector-bottom-sheet/language-selector-bottom-sheet';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { LANGUAGES } from '../../../@generic/constant/languages.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useSettingsContext } from '../../context/settings.context';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsCard } from '../settings-card/settings-card';

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
            <SettingsCard
                right={
                    <View className="ml-auto">
                        <Icon className="text-primary" icon={ICONS.ChevronRight} />
                    </View>
                }
                left={<CircleIcon icon={ICONS.Globe} variant='default' size='1_5xl' border={false} />}
                onPress={handleOpen}
                title={t`Language`}
                description={`${selectedLanguage.emoji} ${i18n.t(selectedLanguage.name)}`}
            />

            <LanguageSelectorBottomSheet language={settings.language} onSelect={updateDefaultInstrument} ref={ref} />
        </>
    );
};

import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CountryFlag } from '../../../@generic/component/country-flag/country-flag';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { LANGUAGES } from '../../../i18n/constant/languages.constant';
import { useLanguageSelectorModal } from '../../../i18n/context/language-selector-modal.context';
import { i18nEnsureLanguageActivated } from '../../../i18n/util/i18n.util';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsCard } from '../settings-card/settings-card';

export const LanguageSelector = () => {
    const language = useSetting('language');
    const { t } = useLingui();
    const [openLanguageSelector] = useLanguageSelectorModal();

    const selectedLanguage = LANGUAGES.find(({ code }) => code === language);

    const handleOpen = async () => {
        const result = await openLanguageSelector({ selectedLanguage: language });
        if (isDefined(result)) {
            await updateSettingsMutation({ language: result });
            await i18nEnsureLanguageActivated(result);
        }
    };

    if (!isDefined(selectedLanguage)) {
        return null;
    }

    return (
        <SettingsCard
            title={t`Language`}
            onPress={handleOpen}
            description={t(selectedLanguage.name)}
            testID={SettingsPageSelector.LanguageCard(selectedLanguage.code)}
            left={
                <View className="w-9 h-9 rounded-full bg-secondary-foreground/10 justify-center items-center">
                    <CountryFlag language={selectedLanguage.code} size={20} />
                </View>
            }
        />
    );
};

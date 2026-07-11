import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { EmojiText } from '../../../@generic/component/emoji-text/emoji-text';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { LANGUAGES } from '../../../i18n/constant/languages.constant';
import { useLanguageSelectorModal } from '../../../i18n/context/language-selector-modal.context';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsCard } from '../settings-card/settings-card';

export const LanguageSelector = () => {
    const language = useSetting('language');
    const { i18n, t } = useLingui();
    const [openLanguageSelector] = useLanguageSelectorModal();

    const selectedLanguage = LANGUAGES.find(({ code }) => code === language);

    const handleOpen = async () => {
        const result = await openLanguageSelector({ selectedLanguage: language });
        if (isDefined(result)) {
            await updateSettingsMutation({ language: result });
            i18n.activate(result);
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
            testID={SettingsPageSelector.LanguageCard}
            descriptionTestID={SettingsPageSelector.LanguageValue(selectedLanguage.code)}
            left={
                <View className="w-9 h-9 rounded-full bg-secondary-foreground/10 justify-center items-center">
                    <EmojiText className="text-lg">{selectedLanguage.emoji}</EmojiText>
                </View>
            }
        />
    );
};

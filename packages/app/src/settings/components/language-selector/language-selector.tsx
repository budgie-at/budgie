import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

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
            icon={UserIconNameEnum.Globe}
            variant="default"
            title={t`Language`}
            onPress={handleOpen}
            description={`${selectedLanguage.emoji} ${t(selectedLanguage.name)}`}
            testID={SettingsPageSelector.LanguageCard}
            descriptionTestID={SettingsPageSelector.LanguageValue(selectedLanguage.code)}
        />
    );
};

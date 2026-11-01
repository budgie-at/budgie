import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { LANGUAGES } from '../../../i18n/constant/languages.constant';
import { useLanguageSelectorModal } from '../../../i18n/context/language-selector-modal.context';
import { i18nEnsureLanguageActivated } from '../../../i18n/utils/i18n.util';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsRowAccessory } from '../settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../settings-row/settings-row';

export const LanguageSelector = () => {
    const language = useSetting('language');
    const { t } = useLingui();
    const [openLanguageSelector] = useLanguageSelectorModal();

    const selectedLanguage = LANGUAGES.find(({ code }) => code === language);

    const handleOpen = () => {
        openLanguageSelector({ selectedLanguage: language }, result => {
            if (isDefined(result)) {
                appRuntime.runFork(
                    logAndContinue(
                        updateSettingsMutation({ language: result }).pipe(
                            Effect.andThen(i18nEnsureLanguageActivated(result)),
                            toastOnFailure(t`Could not update settings`)
                        )
                    )
                );
            }
        });
    };

    if (!isDefined(selectedLanguage)) {
        return null;
    }

    return (
        <SettingsRow
            icon={UserIconNameEnum.Globe}
            variant="ghost"
            title={t`Language`}
            onPress={handleOpen}
            testID={SettingsPageSelector.LanguageCard(selectedLanguage.code)}
            right={<SettingsRowAccessory value={t(selectedLanguage.name)} />}
        />
    );
};

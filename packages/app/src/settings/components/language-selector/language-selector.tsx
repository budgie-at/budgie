import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { RoundedEdgeEnum } from '../../../@generic/enum/rounded-edge.enum';
import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { LANGUAGES } from '../../../i18n/constant/languages.constant';
import { i18nEnsureLanguageActivated } from '../../../i18n/utils/i18n.util';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { AnchoredSettingsRow } from '../anchored-settings-row/anchored-settings-row';
import { SettingsRowAccessory } from '../settings-row-accessory/settings-row-accessory';

import type { AnchoredMorphOriginInterface } from '../../../@generic/interface/anchored-morph-origin.interface';

export const LanguageSelector = () => {
    const language = useSetting('language');
    const { t } = useLingui();
    const openLanguageSelector = useOpenModal('/language-selector');

    const selectedLanguage = LANGUAGES.find(({ code }) => code === language);

    const handleOpen = (origin: AnchoredMorphOriginInterface) => {
        openLanguageSelector({ selectedLanguage: language, origin }, result => {
            if (isDefined(result) && result !== language) {
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
        <AnchoredSettingsRow
            edge={RoundedEdgeEnum.TOP}
            icon={UserIconNameEnum.Globe}
            title={t`Language`}
            right={<SettingsRowAccessory value={t(selectedLanguage.name)} />}
            testID={SettingsPageSelector.LanguageCard(selectedLanguage.code)}
            onPress={handleOpen}
        />
    );
};

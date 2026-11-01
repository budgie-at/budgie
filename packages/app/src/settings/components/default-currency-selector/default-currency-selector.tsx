import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useCurrencySelectorModal } from '../../../@generic/context/currency-selector-modal.context';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { defaultInstrumentAtom } from '../../constants/settings-atoms.constant';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsRowAccessory } from '../settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../settings-row/settings-row';

export const DefaultCurrencySelector = () => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const [openCurrencySelector] = useCurrencySelectorModal();
    const { t } = useLingui();

    const handleOpen = () => {
        openCurrencySelector({ selectedInstrumentId: defaultInstrument.id }, result => {
            if (isDefined(result)) {
                appRuntime.runFork(
                    logAndContinue(
                        updateSettingsMutation({ defaultInstrumentId: result }).pipe(toastOnFailure(t`Could not update settings`))
                    )
                );
            }
        });
    };

    return (
        <SettingsRow
            icon={UserIconNameEnum.Banknote}
            variant="ghost"
            title={t`Default currency`}
            subtitle={t`Used for totals and reports`}
            testID={SettingsPageSelector.MainCurrencyCard(defaultInstrument.code)}
            right={<SettingsRowAccessory value={defaultInstrument.code} />}
            onPress={handleOpen}
        />
    );
};

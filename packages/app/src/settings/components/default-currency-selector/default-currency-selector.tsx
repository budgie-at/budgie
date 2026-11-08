import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useCurrencySelectorModal } from '../../../@generic/context/currency-selector-modal.context';
import { RoundedEdgeEnum } from '../../../@generic/enum/rounded-edge.enum';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { defaultInstrumentAtom } from '../../constants/settings-atoms.constant';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { AnchoredSettingsRow } from '../anchored-settings-row/anchored-settings-row';
import { SettingsRowAccessory } from '../settings-row-accessory/settings-row-accessory';

import type { AnchoredMorphOriginInterface } from '../../../@generic/interface/anchored-morph-origin.interface';

export const DefaultCurrencySelector = () => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const [openCurrencySelector] = useCurrencySelectorModal();
    const { t } = useLingui();

    const handleOpen = (origin: AnchoredMorphOriginInterface) => {
        openCurrencySelector({ selectedInstrumentId: defaultInstrument.id, origin }, result => {
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
        <AnchoredSettingsRow
            edge={RoundedEdgeEnum.NONE}
            icon={UserIconNameEnum.Banknote}
            title={t`Default currency`}
            subtitle={t`Used for totals and reports`}
            right={<SettingsRowAccessory value={defaultInstrument.code} />}
            testID={SettingsPageSelector.MainCurrencyCard(defaultInstrument.code)}
            onPress={handleOpen}
        />
    );
};

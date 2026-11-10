import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isPositiveNumber } from '@rnw-community/shared';

import { RoundedEdgeEnum } from '../../../@generic/enum/rounded-edge.enum';
import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { defaultInstrumentAtom } from '../../constants/settings-atoms.constant';
import { runSettingsUpdate } from '../../utils/run-settings-update.util';
import { AnchoredSettingsRow } from '../anchored-settings-row/anchored-settings-row';
import { SettingsRowAccessory } from '../settings-row-accessory/settings-row-accessory';

import type { AnchoredMorphOriginInterface } from '../../../@generic/interface/anchored-morph-origin.interface';

export const DefaultCurrencySelector = () => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const openCurrencySelector = useOpenModal('/currency-selector');
    const { t } = useLingui();

    const handleOpen = (origin: AnchoredMorphOriginInterface) => {
        openCurrencySelector({ selectedInstrumentId: defaultInstrument.id, origin }, result => {
            if (isPositiveNumber(result)) {
                runSettingsUpdate({ defaultInstrumentId: result });
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

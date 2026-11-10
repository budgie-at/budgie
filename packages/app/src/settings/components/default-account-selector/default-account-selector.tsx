import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { RoundedEdgeEnum } from '../../../@generic/enum/rounded-edge.enum';
import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { defaultAccountAtom } from '../../constants/settings-atoms.constant';
import { runSettingsUpdate } from '../../utils/run-settings-update.util';
import { AnchoredSettingsRow } from '../anchored-settings-row/anchored-settings-row';
import { SettingsRowAccessory } from '../settings-row-accessory/settings-row-accessory';

import type { AnchoredMorphOriginInterface } from '../../../@generic/interface/anchored-morph-origin.interface';

export const DefaultAccountSelector = () => {
    const defaultAccount = useAtomValue(defaultAccountAtom);
    const { t } = useLingui();
    const openAccountSelector = useOpenModal('/account-selector');

    const selectedAccount = isDefined(defaultAccount?.deletedAt) ? null : defaultAccount;
    const icon = selectedAccount?.icon ?? UserIconNameEnum.Wallet;
    const accountLabel = selectedAccount?.title ?? t`None`;
    const defaultAccountSelectorId = SettingsPageSelector.DefaultAccountCard(selectedAccount);

    const handleSelect = (origin: AnchoredMorphOriginInterface) => {
        openAccountSelector({ initialAccountId: defaultAccount?.id ?? null, origin }, accountId => {
            if (isDefined(accountId)) {
                runSettingsUpdate({ defaultAccountId: accountId });
            }
        });
    };

    return (
        <AnchoredSettingsRow
            edge={RoundedEdgeEnum.BOTTOM}
            icon={icon}
            title={t`Default account`}
            right={<SettingsRowAccessory value={accountLabel} />}
            testID={defaultAccountSelectorId}
            onPress={handleSelect}
        />
    );
};

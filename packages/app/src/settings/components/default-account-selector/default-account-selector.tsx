import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { RoundedEdgeEnum } from '../../../@generic/enum/rounded-edge.enum';
import { useAnchoredMorphOriginPress } from '../../../@generic/hook/use-anchored-morph-origin-press.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { defaultAccountAtom } from '../../constants/settings-atoms.constant';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsRowAccessory } from '../settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../settings-row/settings-row';

import type { AnchoredMorphOriginInterface } from '../../../@generic/interface/anchored-morph-origin.interface';
import type { ComponentProps } from 'react';

export const DefaultAccountSelector = () => {
    const defaultAccount = useAtomValue(defaultAccountAtom);
    const { t } = useLingui();
    const [openAccountSelector] = useAccountSelectorModal();

    const selectedAccount = isDefined(defaultAccount?.deletedAt) ? null : defaultAccount;
    const icon = selectedAccount?.icon ?? UserIconNameEnum.Wallet;
    const accountLabel = selectedAccount?.title ?? t`None`;
    const defaultAccountSelectorId = SettingsPageSelector.DefaultAccountCard(selectedAccount);

    const handleSelect = (origin: AnchoredMorphOriginInterface) => {
        openAccountSelector({ initialAccountId: defaultAccount?.id ?? null, origin }, accountId => {
            if (isDefined(accountId)) {
                appRuntime.runFork(
                    logAndContinue(
                        updateSettingsMutation({ defaultAccountId: accountId }).pipe(toastOnFailure(t`Could not update settings`))
                    )
                );
            }
        });
    };

    const rowProps: Omit<ComponentProps<typeof SettingsRow>, 'onPress'> = {
        icon,
        variant: 'ghost',
        title: t`Default account`,
        right: <SettingsRowAccessory value={accountLabel} />,
        testID: defaultAccountSelectorId
    };
    const ghost = <SettingsRow {...rowProps} onPress={emptyFn} />;
    const { ref, handlePress } = useAnchoredMorphOriginPress(RoundedEdgeEnum.BOTTOM, ghost, handleSelect);

    return (
        <View ref={ref} collapsable={false}>
            <SettingsRow {...rowProps} onPress={handlePress} />
        </View>
    );
};

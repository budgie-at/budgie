import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { PopoverMenu, PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';

import { AccountCardMenuSelector } from './account-card-menu.selector';

interface Props {
    readonly integrationId: number | null;
    readonly anchor?: PopoverMenuAnchor;
    readonly isOpen: boolean;
    readonly onClose: (afterClose?: EmptyFn) => void;
    readonly onCloseComplete: EmptyFn;
    readonly onEdit: EmptyFn;
    readonly onImport?: EmptyFn;
}

export const AccountCardMenu = ({ integrationId, anchor, isOpen, onClose, onCloseComplete, onEdit, onImport }: Props) => {
    const { t } = useLingui();

    const handleImport = () => void onClose(onImport);
    const handleEdit = () => void onClose(onEdit);
    const handleIntegrationSettings = () =>
        void onClose(() => void router.push({ pathname: '/bank-integration/[id]', params: { id: String(integrationId) } }));

    return (
        <PopoverMenu isOpen={isOpen} onClose={onClose} onCloseComplete={onCloseComplete} anchor={anchor} align="auto">
            <View className="py-sm">
                {isDefined(onImport) ? (
                    <PopoverMenuItem
                        icon={UserIconNameEnum.FileUp}
                        label={t`Import file`}
                        onPress={handleImport}
                        testID={AccountCardMenuSelector.ImportButton}
                    />
                ) : null}
                <PopoverMenuItem
                    icon={UserIconNameEnum.Pencil}
                    label={t`Edit account`}
                    onPress={handleEdit}
                    testID={AccountCardMenuSelector.EditButton}
                />
                {isDefined(integrationId) ? (
                    <PopoverMenuItem
                        icon={UserIconNameEnum.Settings}
                        label={t`Bank integration settings`}
                        onPress={handleIntegrationSettings}
                        testID={AccountCardMenuSelector.IntegrationSettingsButton}
                    />
                ) : null}
            </View>
        </PopoverMenu>
    );
};

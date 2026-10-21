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
    readonly onClose: EmptyFn;
    readonly onEdit: EmptyFn;
    readonly onImport?: EmptyFn;
}

export const AccountCardMenu = ({ integrationId, anchor, isOpen, onClose, onEdit, onImport }: Props) => {
    const { t } = useLingui();

    const handleImport = () => {
        onClose();
        onImport?.();
    };
    const handleEdit = () => {
        onClose();
        onEdit();
    };
    const handleIntegrationSettings = () => {
        onClose();
        router.push({ pathname: '/bank-integration/[id]', params: { id: String(integrationId) } });
    };

    return (
        <PopoverMenu isOpen={isOpen} onClose={onClose} anchor={anchor} align="auto">
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

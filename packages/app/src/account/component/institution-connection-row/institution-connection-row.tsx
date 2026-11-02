import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { InstitutionSelector } from '../../../app/(main)/institution/institution.selector';
import { SettingsRowAccessory } from '../../../settings/components/settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { useBankIntegration } from '../../../sync/context/bank-integration.context';
import { BankIntegrationSyncStatusEnum } from '../../../sync/enum/bank-integration-sync-status.enum';
import { useBankIntegrationAccountPreviewsQuery } from '../../../sync/query/use-bank-integration-account-previews.query';
import { getBankIntegrationSyncStatus } from '../../../sync/utils/get-bank-integration-sync-status.util';

import type { SyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly syncs: SyncEntityInterface[];
}

export const InstitutionConnectionRow = ({ syncs }: Props) => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const { isKeyRejected } = useBankIntegrationAccountPreviewsQuery(integration.id);
    const status = getBankIntegrationSyncStatus(syncs, isKeyRejected);
    if (status !== BankIntegrationSyncStatusEnum.NEEDS_ATTENTION && status !== BankIntegrationSyncStatusEnum.KEY_REJECTED) {
        return null;
    }

    const isKeyRejectedStatus = status === BankIntegrationSyncStatusEnum.KEY_REJECTED;
    const title = isKeyRejectedStatus ? t`Update access key` : t`Review connection`;
    const statusLabel = isKeyRejectedStatus ? t`Key rejected` : t`Needs attention`;
    const subtitle = <Text className="text-destructive-foreground text-[15px]">{statusLabel}</Text>;

    const handleSettings = () => void router.push({ pathname: '/bank-integration/[id]', params: { id: String(integration.id) } });

    return (
        <GroupedListSection>
            <SettingsRow
                title={title}
                icon={UserIconNameEnum.Settings}
                variant="destructive"
                subtitle={subtitle}
                right={<SettingsRowAccessory />}
                testID={InstitutionSelector.SettingsRow}
                onPress={handleSettings}
            />
        </GroupedListSection>
    );
};

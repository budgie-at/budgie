import { SyncEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { InstitutionSelector } from '../../../app/(main)/institution/institution.selector';
import { SettingsRowAccessory } from '../../../settings/components/settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { quickImportConfigMap } from '../../../sync/constant/quick-import-config-map.constant';
import { useBankIntegration } from '../../../sync/context/bank-integration.context';
import { BankIntegrationSyncStatusEnum } from '../../../sync/enum/bank-integration-sync-status.enum';
import { useQuickImport } from '../../../sync/hook/use-quick-import.hook';
import { useBankIntegrationAccountPreviewsQuery } from '../../../sync/query/use-bank-integration-account-previews.query';
import { getBankIntegrationSyncStatus } from '../../../sync/utils/get-bank-integration-sync-status.util';

interface Props {
    readonly syncs: SyncEntityInterface[];
}

export const InstitutionStatementRow = ({ syncs }: Props) => {
    const { t } = useLingui();
    const quickImportConfig = syncs.map(sync => quickImportConfigMap[sync.provider]).find(isDefined) ?? null;
    const { handleQuickImport } = useQuickImport(quickImportConfig);
    const { integration } = useBankIntegration();
    const { isKeyRejected } = useBankIntegrationAccountPreviewsQuery(integration.id);

    if (getBankIntegrationSyncStatus(syncs, isKeyRejected) !== BankIntegrationSyncStatusEnum.NEEDS_STATEMENT) {
        return null;
    }

    return (
        <GroupedListSection>
            <SettingsRow
                title={t`Import a statement`}
                subtitle={
                    <Text className="text-secondary-foreground text-[15px]">{t`A bank statement hasn't confirmed this balance yet`}</Text>
                }
                icon={UserIconNameEnum.FileUp}
                variant="default"
                right={<SettingsRowAccessory />}
                testID={InstitutionSelector.StatementRow}
                onPress={handleQuickImport}
            />
        </GroupedListSection>
    );
};

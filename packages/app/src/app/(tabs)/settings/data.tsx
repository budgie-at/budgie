import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { ExportCsv } from '../../../export/components/export-csv/export-csv';
import { ImportCsv } from '../../../import/components/import-csv/import-csv';
import { MoneyDataUpgradeStatusCard } from '../../../money-data/component/money-data-upgrade-status-card/money-data-upgrade-status-card';
import { ConsolidateTransfers } from '../../../settings/components/consolidate-transfers/consolidate-transfers';
import { RecalculateBalances } from '../../../settings/components/recalculate-balances/recalculate-balances';
import { RepairSyncData } from '../../../settings/components/repair-sync-data/repair-sync-data';
import { TruncateData } from '../../../settings/components/truncate-data/truncate-data';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';

import { DataPageSelector } from './data-page.selector';
import { SettingsPageSelector } from './settings-page.selector';

export default function DataPage() {
    const { t } = useLingui();

    return (
        <CollapsibleChromePage
            title={t`Data tools`}
            leading={<GoBackButton onPress={goBackToSettings} />}
            testID={DataPageSelector.Container}
        >
            <View className="gap-y-7xl pb-5xl">
                <GroupedListSection title={t`CSV files`}>
                    <ImportCsv />
                    <ExportCsv />
                </GroupedListSection>

                <GroupedListSection title={t`Maintenance`} footer={t`Use these only if conversions, imports or balances look wrong.`}>
                    <MoneyDataUpgradeStatusCard testID={SettingsPageSelector.MoneyDataUpgradeCard} />
                    <RepairSyncData />
                    <ConsolidateTransfers />
                    <RecalculateBalances />
                </GroupedListSection>

                <GroupedListSection footer={t`Erases everything in Budgie. This can't be undone.`}>
                    <TruncateData />
                </GroupedListSection>
                <MenuSpacer />
            </View>
        </CollapsibleChromePage>
    );
}

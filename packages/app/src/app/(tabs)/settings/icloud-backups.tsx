import { useLingui } from '@lingui/react/macro';
import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { CloudBackupList } from '../../../cloud-backup/component/cloud-backup-list/cloud-backup-list';
import { IS_CLOUD_BACKUP_SUPPORTED } from '../../../cloud-backup/constant/is-cloud-backup-supported.constant';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';

import { ICloudBackupsPageSelector } from './icloud-backups-page.selector';

export default function ICloudBackupsPage() {
    const { t } = useLingui();

    if (!IS_CLOUD_BACKUP_SUPPORTED) {
        return <Redirect href="/settings" />;
    }

    return (
        <CollapsibleChromePage
            title={t`Restore from iCloud`}
            leading={<GoBackButton onPress={goBackToSettings} />}
            testID={ICloudBackupsPageSelector.Container}
        >
            <View className="gap-y-7xl pb-5xl">
                <CloudBackupList />
                <MenuSpacer />
            </View>
        </CollapsibleChromePage>
    );
}

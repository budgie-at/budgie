import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { CloudBackupList } from '../../../cloud-backup/component/cloud-backup-list/cloud-backup-list';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';

import { ICloudBackupsPageSelector } from './icloud-backups-page.selector';

export default function ICloudBackupsPage() {
    const { t } = useLingui();

    return (
        <CollapsibleChromePage
            title={t`iCloud backups`}
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

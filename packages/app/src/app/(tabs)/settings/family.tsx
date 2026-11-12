import { useLingui } from '@lingui/react/macro';
import { Redirect } from 'expo-router';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { IS_CLOUD_BACKUP_SUPPORTED } from '../../../cloud-backup/constant/is-cloud-backup-supported.constant';
import { FamilyPageContent } from '../../../household/component/family-page-content/family-page-content';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';

import { FamilyPageSelector } from './family-page.selector';

export default function FamilyPage() {
    const { t } = useLingui();

    if (!IS_CLOUD_BACKUP_SUPPORTED) {
        return <Redirect href="/settings" />;
    }

    return (
        <CollapsibleChromePage
            title={t`Family`}
            leading={<GoBackButton onPress={goBackToSettings} />}
            testID={FamilyPageSelector.Container}
        >
            <FamilyPageContent />
            <MenuSpacer />
        </CollapsibleChromePage>
    );
}

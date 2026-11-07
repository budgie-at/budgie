import { useLingui } from '@lingui/react/macro';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { FamilyPageContent } from '../../../household/component/family-page-content/family-page-content';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';

import { FamilyPageSelector } from './family-page.selector';

export default function FamilyPage() {
    const { t } = useLingui();

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

import { useLingui } from '@lingui/react/macro';

import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { CategorizeInboxNavTitle } from '../categorize-inbox-nav-title/categorize-inbox-nav-title';
import { CategorizeInboxOneOffsList } from '../categorize-inbox-one-offs-list/categorize-inbox-one-offs-list';
import { CategorizeInboxScreenChrome } from '../categorize-inbox-screen-chrome/categorize-inbox-screen-chrome';

export const CategorizeInboxOneOffsScreen = () => {
    const { t } = useLingui();

    return (
        <GroupedSurface>
            <CategorizeInboxScreenChrome title={<CategorizeInboxNavTitle>{t`Smaller groups`}</CategorizeInboxNavTitle>}>
                <CategorizeInboxOneOffsList />
            </CategorizeInboxScreenChrome>
        </GroupedSurface>
    );
};

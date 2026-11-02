import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { Icon } from '../../../@generic/component/icon/icon';
import { SyncRepairsPageSelector } from '../../../app/(tabs)/settings/sync-repairs-page.selector';

export const SyncRepairsEmptyStateCard = () => {
    const { t } = useLingui();

    return (
        <GroupedListSection>
            <GroupedListRow
                testID={SyncRepairsPageSelector.EmptyState}
                title={t`No problems found`}
                subtitle={t`Synced data looks consistent.`}
                left={<Icon icon={UserIconNameEnum.CircleCheck} size={24} className="text-positive-foreground" />}
            />
        </GroupedListSection>
    );
};

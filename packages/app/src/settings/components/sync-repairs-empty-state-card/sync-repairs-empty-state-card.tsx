import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { Icon } from '../../../@generic/component/icon/icon';
import { SyncRepairsPageSelector } from '../../../app/(tabs)/settings/sync-repairs-page.selector';

interface Props {
    readonly repairedTransactionCount: number | null;
}

export const SyncRepairsEmptyStateCard = ({ repairedTransactionCount }: Props) => {
    const { t } = useLingui();
    const title = isDefined(repairedTransactionCount)
        ? t({ message: plural(repairedTransactionCount, { one: 'Removed # duplicate', other: 'Removed # duplicates' }) })
        : t`No problems found`;
    const subtitle = isDefined(repairedTransactionCount) ? t`Synced data looks consistent now.` : t`Synced data looks consistent.`;

    return (
        <GroupedListSection>
            <GroupedListRow
                testID={SyncRepairsPageSelector.EmptyState}
                title={title}
                subtitle={subtitle}
                left={<Icon icon={UserIconNameEnum.CircleCheck} size={24} className="text-positive-foreground" />}
            />
        </GroupedListSection>
    );
};

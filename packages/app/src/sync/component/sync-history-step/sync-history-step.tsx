import { SyncHistoryDepthEnum } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SYNC_HISTORY_DEPTH_OPTIONS } from '../../constant/sync-history-depth-options.constant';
import { SyncHistoryRow } from '../sync-history-row/sync-history-row';

interface Props {
    readonly selectedDepth: SyncHistoryDepthEnum;
    readonly description?: string;
    readonly hintByDepth?: Record<SyncHistoryDepthEnum, string>;
    readonly onSelect: (depth: SyncHistoryDepthEnum) => void;
}

export const SyncHistoryStep = ({ selectedDepth, description, hintByDepth, onSelect }: Props) => {
    const { t } = useLingui();

    const titleByDepth: Record<SyncHistoryDepthEnum, string> = {
        [SyncHistoryDepthEnum.MONTH_1]: t`Last 1 month`,
        [SyncHistoryDepthEnum.MONTHS_3]: t`Last 3 months`,
        [SyncHistoryDepthEnum.MONTHS_6]: t`Last 6 months`,
        [SyncHistoryDepthEnum.YEAR_1]: t`Last year`,
        [SyncHistoryDepthEnum.FULL]: t`Whole period`,
        [SyncHistoryDepthEnum.NEW_ONLY]: t`Do not sync history`
    };
    const defaultHintByDepth: Record<SyncHistoryDepthEnum, string> = {
        [SyncHistoryDepthEnum.MONTH_1]: t`Everything from the last month`,
        [SyncHistoryDepthEnum.MONTHS_3]: t`Everything from the last 3 months`,
        [SyncHistoryDepthEnum.MONTHS_6]: t`Everything from the last 6 months`,
        [SyncHistoryDepthEnum.YEAR_1]: t`Everything from the last year`,
        [SyncHistoryDepthEnum.FULL]: t`As far back as your bank allows`,
        [SyncHistoryDepthEnum.NEW_ONLY]: t`Nothing from the past is imported`
    };
    const hints = hintByDepth ?? defaultHintByDepth;
    const footer = description ?? t`Choose how far back to import. Your bank sends it in one go, and it may keep less than you ask for.`;

    return (
        <GroupedListSection footer={footer}>
            {SYNC_HISTORY_DEPTH_OPTIONS.map(({ depth, icon }) => (
                <SyncHistoryRow
                    key={depth}
                    depth={depth}
                    icon={icon}
                    title={titleByDepth[depth]}
                    hint={hints[depth]}
                    isSelected={depth === selectedDepth}
                    onSelect={onSelect}
                />
            ))}
        </GroupedListSection>
    );
};

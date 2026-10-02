import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { SYNC_HISTORY_DEPTH_OPTIONS } from '../../constant/sync-history-depth-options.constant';
import { SyncHistoryDepthEnum } from '../../enum/sync-history-depth.enum';
import { SyncHistoryDepthOption } from '../sync-history-depth-option/sync-history-depth-option';
import { SyncHistoryDurationNotice } from '../sync-history-duration-notice/sync-history-duration-notice';

interface Props {
    readonly selectedDepth: SyncHistoryDepthEnum;
    readonly onSelect: (depth: SyncHistoryDepthEnum) => void;
}

export const SyncHistoryDepthStep = ({ selectedDepth, onSelect }: Props) => {
    const { t } = useLingui();

    const titleByDepth: Record<SyncHistoryDepthEnum, string> = {
        [SyncHistoryDepthEnum.MONTH_1]: t`Last 1 month`,
        [SyncHistoryDepthEnum.MONTHS_3]: t`Last 3 months`,
        [SyncHistoryDepthEnum.MONTHS_6]: t`Last 6 months`,
        [SyncHistoryDepthEnum.YEAR_1]: t`Last year`,
        [SyncHistoryDepthEnum.FULL]: t`Whole period`,
        [SyncHistoryDepthEnum.NEW_ONLY]: t`Do not sync history`
    };
    const hintByDepth: Record<SyncHistoryDepthEnum, string> = {
        [SyncHistoryDepthEnum.MONTH_1]: t`About a minute`,
        [SyncHistoryDepthEnum.MONTHS_3]: t`About 3 minutes`,
        [SyncHistoryDepthEnum.MONTHS_6]: t`About 6 minutes`,
        [SyncHistoryDepthEnum.YEAR_1]: t`About 12 minutes`,
        [SyncHistoryDepthEnum.FULL]: t`Can take hours`,
        [SyncHistoryDepthEnum.NEW_ONLY]: t`Nothing from the past is imported`
    };

    return (
        <>
            <Text className="text-secondary-foreground text-sm px-md">
                <Trans>Monobank sends about one month of history per minute, for each account you selected.</Trans>
            </Text>

            <View className="gap-md">
                {SYNC_HISTORY_DEPTH_OPTIONS.map(option => (
                    <SyncHistoryDepthOption
                        key={option.depth}
                        depth={option.depth}
                        icon={option.icon}
                        title={titleByDepth[option.depth]}
                        hint={hintByDepth[option.depth]}
                        isSelected={option.depth === selectedDepth}
                        onSelect={onSelect}
                    />
                ))}

                <SyncHistoryDurationNotice depth={selectedDepth} />
            </View>
        </>
    );
};

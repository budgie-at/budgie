import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { AI_DOWNLOAD_CARD_VISUALS } from '../../constant/ai-download-card-visuals.constant';
import { aiModelDownloadSummaryAtom } from '../../constant/ai-model-download-summary-atom.constant';
import { AiModelDownloadStatusEnum } from '../../enum/ai-model-download-status.enum';

import type { PropsWithChildren } from 'react';

interface Props {
    readonly status: AiModelDownloadStatusEnum;
    readonly testID?: string;
}

export const AiDownloadCardFrame = ({ status, testID, children }: PropsWithChildren<Props>) => {
    const { t } = useLingui();
    const summary = useAtomValue(aiModelDownloadSummaryAtom);
    const { icon, label } = AI_DOWNLOAD_CARD_VISUALS[status];
    const value = status === AiModelDownloadStatusEnum.DISABLED ? t`Off` : `${summary.percent}%`;
    const stateValue = status === AiModelDownloadStatusEnum.READY ? t`Ready` : value;

    return (
        <View testID={testID} className="min-h-[220px]">
            <GroupedListRow
                left={<GroupedListIcon icon={icon} />}
                title={t(label)}
                right={<Text className="text-[17px] text-secondary-foreground">{stateValue}</Text>}
            />
            <View className="gap-y-lg px-3xl pb-3xl pt-lg">{children}</View>
        </View>
    );
};

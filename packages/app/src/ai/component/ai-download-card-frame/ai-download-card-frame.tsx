import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { AI_DOWNLOAD_CARD_VISUALS } from '../../constant/ai-download-card-visuals.constant';
import { aiModelDownloadSummaryAtom } from '../../constant/ai-model-download-summary-atom.constant';
import { AiModelDownloadStatusEnum } from '../../enum/ai-model-download-status.enum';

import type { PropsWithChildren } from 'react';

interface Props {
    readonly status: AiModelDownloadStatusEnum;
    readonly testID?: string;
    readonly subtitle: string;
}

export const AiDownloadCardFrame = ({ status, testID, subtitle, children }: PropsWithChildren<Props>) => {
    const { t } = useLingui();
    const summary = useAtomValue(aiModelDownloadSummaryAtom);
    const { icon } = AI_DOWNLOAD_CARD_VISUALS[status];
    const value = status === AiModelDownloadStatusEnum.DISABLED ? t`Off` : `${summary.percent}%`;
    const stateValue = status === AiModelDownloadStatusEnum.READY ? t`Ready` : value;

    return (
        <View testID={testID}>
            <View className="flex-row items-center gap-x-xl px-3xl py-[16px]">
                <GroupedListIcon icon={icon} />
                <View className="min-w-0 flex-1 gap-y-xxs">
                    <Text className="text-[17px] text-primary">
                        <Trans>On-device AI</Trans>
                    </Text>
                    <Text className="text-[13px] leading-[18px] text-secondary-foreground">{subtitle}</Text>
                </View>
                <Text className="text-[17px] font-normal text-secondary-foreground">{stateValue}</Text>
            </View>
            {isDefined(children) ? <View className="gap-y-lg px-3xl pb-lg pt-lg">{children}</View> : null}
        </View>
    );
};

import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';
import { NetworkTypeEnum } from '../../../@generic/enum/network-type.enum';
import { useNetworkType } from '../../../@generic/hook/use-network-type.hook';
import { AiProgressBar } from '../../../settings/components/ai-progress-bar/ai-progress-bar';
import { AiDownloadSelector } from '../../ai-download.selector';
import { useAiModelDownloadAmounts } from '../../hook/use-ai-model-download-amounts.hook';

const handlePress = () => void router.push('/settings/ai');

export const AiDownloadHomeRow = () => {
    const networkType = useNetworkType();
    const { summary, downloaded, total } = useAiModelDownloadAmounts();

    const title =
        networkType === NetworkTypeEnum.WIFI ? <Trans>Downloading AI models on Wi-Fi</Trans> : <Trans>Downloading AI models</Trans>;

    return (
        <Card testID={AiDownloadSelector.HomeRow} variant="ghost" size="sm" className="gap-y-md" onPress={handlePress}>
            <View className="flex-row items-center gap-x-md">
                <Icon icon={UserIconNameEnum.Download} size={16} className="text-pink-foreground" />
                <Text className="flex-1 text-sm font-medium text-primary" numberOfLines={1}>
                    {title}
                </Text>
                <Text className="text-sm text-secondary-foreground">
                    <Trans>
                        {downloaded} of {total} GB
                    </Trans>
                </Text>
            </View>

            <AiProgressBar progress={summary.percent} />
        </Card>
    );
};

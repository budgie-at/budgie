import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';
import { AiDownloadSelector } from '../../ai-download.selector';
import { useAiModelDownloadActions } from '../../hook/use-ai-model-download-actions.hook';
import { useAiModelDownloadAmounts } from '../../hook/use-ai-model-download-amounts.hook';

export const AiDownloadWifiBanner = () => {
    const { t } = useLingui();
    const { downloaded, total, remaining } = useAiModelDownloadAmounts();
    const actions = useAiModelDownloadActions();

    const keptText = t`${downloaded} of ${total} GB is kept. It carries on when you're back on Wi-Fi.`;

    return (
        <Card testID={AiDownloadSelector.WifiBanner} variant="warning" size="md" className="gap-y-lg">
            <View className="flex-row items-start gap-x-md">
                <Icon icon={UserIconNameEnum.WifiOff} size={18} className="text-warning-foreground" />
                <View className="flex-1 gap-y-xs">
                    <Text className="text-sm font-semibold text-primary">
                        <Trans>AI model download paused: no Wi-Fi</Trans>
                    </Text>
                    <Text className="text-sm text-secondary-foreground">{keptText}</Text>
                </View>
            </View>

            <View className="flex-row flex-wrap gap-md">
                <Button
                    testID={AiDownloadSelector.MobileDataButton}
                    size="sm"
                    variant="primary"
                    content={t`Use mobile data for ${remaining} GB`}
                    onPress={actions.allowMobileData}
                />
                <Button
                    testID={AiDownloadSelector.DismissButton}
                    size="sm"
                    variant="ghost"
                    content={t`OK`}
                    onPress={actions.dismissNotice}
                />
            </View>
        </Card>
    );
};

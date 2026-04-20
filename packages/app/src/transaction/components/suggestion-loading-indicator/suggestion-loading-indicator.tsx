import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { Icon } from '../../../@generic/component/icon/icon';
import { AiSystemBrain } from '../../../ai/component/ai-system-brain/ai-system-brain';
import { AiSystemStateEnum } from '../../../ai/enum/ai-system-state.enum';
import { useAiSystemStatus } from '../../../ai/hook/use-ai-system-status.hook';

interface Props {
    readonly showArrow?: boolean;
}

const BRAIN_CONTAINER_SIZE = 26;
const BRAIN_ICON_SIZE = 16;
const ARROW_SIZE = 12;
const HIT_SLOP = 8;

export const SuggestionLoadingIndicator = ({ showArrow = true }: Props) => {
    const router = useRouter();
    const snapshot = useAiSystemStatus();
    const holdProgress = useSharedValue(0);

    const isBootingOrTranslating = snapshot.state === AiSystemStateEnum.BOOTING || snapshot.state === AiSystemStateEnum.TRANSLATING;
    const statusLabel = isBootingOrTranslating ? t`Loading AI model...` : '';
    const showHint = !showArrow;

    const handleBrainPress = () => void router.push({ pathname: '/settings', params: { anchor: 'ai' } });

    return (
        <View className="flex-row items-center gap-xs pl-sm pr-[4%] shrink-0">
            {showHint ? (
                <Pressable className="flex-row items-center gap-xs" onPress={handleBrainPress} hitSlop={HIT_SLOP}>
                    <Text className="text-xs text-secondary-foreground" numberOfLines={1}>
                        {statusLabel}
                    </Text>
                    <AiSystemBrain
                        state={snapshot.state}
                        percent={snapshot.percent}
                        holdProgress={holdProgress}
                        size={BRAIN_CONTAINER_SIZE}
                        iconSize={BRAIN_ICON_SIZE}
                    />
                </Pressable>
            ) : (
                <>
                    <Icon icon={UserIconNameEnum.ArrowLeft} size={ARROW_SIZE} className="text-secondary-foreground" />
                    <AiSystemBrain
                        state={snapshot.state}
                        percent={snapshot.percent}
                        holdProgress={holdProgress}
                        size={BRAIN_CONTAINER_SIZE}
                        iconSize={BRAIN_ICON_SIZE}
                    />
                </>
            )}
        </View>
    );
};

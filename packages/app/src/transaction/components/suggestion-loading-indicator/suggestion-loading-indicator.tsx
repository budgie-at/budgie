import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { t } from '@lingui/core/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { AiSystemBrain } from '../../../ai/component/ai-system-brain/ai-system-brain';
import { aiSystemStatusAtom } from '../../../ai/constant/ai-system-status-atom.constant';
import { AiSystemStateEnum } from '../../../ai/enum/ai-system-state.enum';

const BRAIN_CONTAINER_SIZE = 32;
const BRAIN_ICON_SIZE = 20;
const HIT_SLOP = 8;

export const SuggestionLoadingIndicator = () => {
    const router = useRouter();
    const snapshot = useAtomValue(aiSystemStatusAtom);
    const holdProgress = useSharedValue(0);

    const isBootingOrTranslating = snapshot.state === AiSystemStateEnum.BOOTING || snapshot.state === AiSystemStateEnum.TRANSLATING;
    const isWorking =
        isBootingOrTranslating || snapshot.state === AiSystemStateEnum.INDEXING || snapshot.state === AiSystemStateEnum.BOOSTING;
    const statusLabel = isBootingOrTranslating ? t`Loading AI model...` : t`On-device AI`;

    const handleBrainPress = () => void router.push({ pathname: '/settings', params: { anchor: 'ai' } });

    return (
        <View className="flex-row items-center gap-xs pl-sm pr-[4%] shrink-0">
            <HapticPressable
                accessibilityRole="button"
                accessibilityLabel={t`On-device AI`}
                className="min-h-[44px] flex-row items-center gap-xs"
                onPress={handleBrainPress}
                hitSlop={HIT_SLOP}
            >
                <Text
                    className="text-[13px] font-medium text-secondary-foreground"
                    dynamicTypeRamp="caption2"
                    maxFontSizeMultiplier={1.35}
                    numberOfLines={1}
                >
                    {statusLabel}
                </Text>
                {isWorking ? (
                    <AiSystemBrain
                        state={snapshot.state}
                        percent={snapshot.percent}
                        holdProgress={holdProgress}
                        size={BRAIN_CONTAINER_SIZE}
                        iconSize={BRAIN_ICON_SIZE}
                    />
                ) : (
                    <Icon icon={UserIconNameEnum.Brain} size={20} className="text-secondary-foreground" />
                )}
            </HapticPressable>
        </View>
    );
};

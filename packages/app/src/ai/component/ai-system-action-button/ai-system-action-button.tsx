import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { getAiSystemActionVisuals } from '../../constant/ai-system-state-visuals.constant';
import { AiSystemActionEnum } from '../../enum/ai-system-action.enum';

interface Props {
    readonly action: AiSystemActionEnum;
    readonly onPress: () => void;
}

const HIT_SLOP = 8;
const ICON_SIZE = 20;

const HAPTIC_TIER: Record<AiSystemActionEnum, Haptics.ImpactFeedbackStyle | null> = {
    [AiSystemActionEnum.None]: null,
    [AiSystemActionEnum.Boost]: Haptics.ImpactFeedbackStyle.Light,
    [AiSystemActionEnum.Cancel]: Haptics.ImpactFeedbackStyle.Medium,
    [AiSystemActionEnum.Retry]: Haptics.ImpactFeedbackStyle.Medium
};

export const AiSystemActionButton = ({ action, onPress }: Props) => {
    const visual = getAiSystemActionVisuals()[action];
    const tier = HAPTIC_TIER[action];
    const { icon } = visual;

    if (!isDefined(icon)) {
        return null;
    }

    const handlePress = () => {
        if (isDefined(tier)) {
            void Haptics.impactAsync(tier);
        }
        onPress();
    };

    return (
        <Pressable onPress={handlePress} hitSlop={HIT_SLOP} accessibilityRole="button" accessibilityHint={visual.accessibilityHint}>
            <Icon icon={icon} size={ICON_SIZE} />
        </Pressable>
    );
};

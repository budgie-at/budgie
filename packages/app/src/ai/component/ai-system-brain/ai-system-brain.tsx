import { UserIconNameEnum } from '@budgie/contracts';
import { SharedValue } from 'react-native-reanimated';

import { AI_SYSTEM_STATE_VISUALS } from '../../constant/ai-system-state-visuals.constant';
import { AiSystemStateEnum } from '../../enum/ai-system-state.enum';
import { AiSubsystemIcon } from '../ai-subsystem-icon/ai-subsystem-icon';

interface Props {
    readonly state: AiSystemStateEnum;
    readonly percent: number;
    readonly holdProgress: SharedValue<number>;
    readonly size: number;
    readonly iconSize: number;
}

export const AiSystemBrain = ({ state, percent, holdProgress, size, iconSize }: Props) => {
    const visuals = AI_SYSTEM_STATE_VISUALS[state];

    return (
        <AiSubsystemIcon
            icon={UserIconNameEnum.Brain}
            percent={percent}
            holdProgress={holdProgress}
            size={size}
            iconSize={iconSize}
            pulsePeriodMs={visuals.pulsePeriodMs}
            colorClass="text-positive-foreground"
        />
    );
};

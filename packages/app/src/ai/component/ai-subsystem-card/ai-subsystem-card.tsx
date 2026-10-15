import { UserIconNameEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import { SharedValue } from 'react-native-reanimated';

import { AI_SUBSYSTEM_CARD_VISUALS } from '../../constant/ai-subsystem-card-visuals.constant';
import { AiSubsystemStatusSnapshotInterface } from '../../interface/ai-subsystem-status-snapshot.interface';
import { AiSubsystemIcon } from '../ai-subsystem-icon/ai-subsystem-icon';
import { AiSubsystemStatusCardLayout } from '../ai-subsystem-status-card-layout/ai-subsystem-status-card-layout';

const ICON_SIZE = 20;
const CIRCLE_SIZE = 36;

interface Props {
    readonly snapshot: AiSubsystemStatusSnapshotInterface;
    readonly icon: UserIconNameEnum;
    readonly title: ReactNode;
    readonly rebuildAlertTitle: string;
    readonly rebuildAlertMessage: string;
    readonly rebuildLogKey: string;
    readonly onRebuild: () => Promise<void>;
}

export const AiSubsystemCard = ({ snapshot, icon, title, rebuildAlertTitle, rebuildAlertMessage, rebuildLogKey, onRebuild }: Props) => {
    const visuals = AI_SUBSYSTEM_CARD_VISUALS[snapshot.state];

    const renderLeftIcon = (holdProgress: SharedValue<number>, colorClass: string) => (
        <AiSubsystemIcon
            icon={icon}
            percent={snapshot.percent}
            holdProgress={holdProgress}
            size={CIRCLE_SIZE}
            iconSize={ICON_SIZE}
            pulsePeriodMs={visuals.pulsePeriodMs}
            colorClass={colorClass}
        />
    );

    return (
        <AiSubsystemStatusCardLayout
            snapshot={snapshot}
            title={title}
            renderLeftIcon={renderLeftIcon}
            rebuildAlertTitle={rebuildAlertTitle}
            rebuildAlertMessage={rebuildAlertMessage}
            rebuildLogKey={rebuildLogKey}
            onRebuild={onRebuild}
        />
    );
};

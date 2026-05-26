import { UserIconNameEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { AiProgressBar } from '../../../settings/components/ai-progress-bar/ai-progress-bar';
import { MoneyDataUpgradeProgressStateEnum } from '../../enum/money-data-upgrade-progress-state.enum';
import { useMoneyDataUpgradeStatus } from '../../hook/use-money-data-upgrade-status.hook';

import type { ComponentProps } from 'react';

const STATE_TEXT_CLASS: Record<MoneyDataUpgradeProgressStateEnum, string> = {
    [MoneyDataUpgradeProgressStateEnum.READY]: 'text-secondary-foreground',
    [MoneyDataUpgradeProgressStateEnum.WORKING]: 'text-warning-foreground',
    [MoneyDataUpgradeProgressStateEnum.COMPLETE]: 'text-positive-foreground',
    [MoneyDataUpgradeProgressStateEnum.ERROR]: 'text-destructive-foreground'
};

export const MoneyDataUpgradeStatusCard = ({ testID }: Pick<ComponentProps<typeof HorizontalCell>, 'testID'>) => {
    const { snapshot, handlePrimaryAction } = useMoneyDataUpgradeStatus();
    const percentText = `${snapshot.percent}%`;
    const isWorking = snapshot.state === MoneyDataUpgradeProgressStateEnum.WORKING;
    const isActionable = !isWorking;
    const statusTestID = isDefined(testID) ? `${testID}.Status.${snapshot.state}` : testID;
    const percentTestID = isDefined(testID) ? `${testID}.Percent.${snapshot.state}` : testID;
    const handlePress = () => {
        void handlePrimaryAction();
    };

    return (
        <HorizontalCell
            testID={testID}
            {...(isActionable && { onPress: handlePress })}
            left={<CircleIcon icon={UserIconNameEnum.Database} variant="positive" border={false} size={36} iconSize={20} />}
            {...(isWorking && {
                right: (
                    <Text testID={percentTestID} className={`text-sm font-medium text-right w-12 ${STATE_TEXT_CLASS[snapshot.state]}`}>
                        {percentText}
                    </Text>
                )
            })}
            variant="secondary"
            contentClassName="gap-y-xs"
        >
            <Text className="text-sm font-medium text-primary">{snapshot.title}</Text>
            <Text testID={statusTestID} className="text-xs font-medium text-secondary-foreground">
                {snapshot.statusText}
            </Text>
            {isWorking ? <AiProgressBar progress={snapshot.percent} /> : null}
        </HorizontalCell>
    );
};

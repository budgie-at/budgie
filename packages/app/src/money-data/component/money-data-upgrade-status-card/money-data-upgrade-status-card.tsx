import { UserIconNameEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
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
    const handlePress = () => {
        void handlePrimaryAction();
    };

    return (
        <HorizontalCell
            testID={testID}
            {...(isActionable && { onPress: handlePress })}
            left={<CircleIcon icon={UserIconNameEnum.Database} variant="positive" border={false} size={36} iconSize={20} />}
            right={
                <Text
                    {...testIDProps(testID, TestIDPartEnum.PERCENT)}
                    className={`text-sm font-medium text-right w-12 ${STATE_TEXT_CLASS[snapshot.state]}`}
                >
                    {percentText}
                </Text>
            }
            contentClassName="gap-y-xs"
        >
            <Text numberOfLines={1} className="text-sm font-medium text-primary">
                {snapshot.title}
            </Text>
            <Text
                numberOfLines={1}
                {...testIDProps(testID, TestIDPartEnum.STATUS, snapshot.state)}
                className="text-xs font-medium text-secondary-foreground"
            >
                {snapshot.statusText}
            </Text>
            <AiProgressBar progress={snapshot.percent} />
        </HorizontalCell>
    );
};

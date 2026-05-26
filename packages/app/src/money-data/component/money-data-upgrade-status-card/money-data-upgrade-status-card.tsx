import { UserIconNameEnum } from '@budgie/contracts';
import { ActivityIndicator, Modal, Text, View } from 'react-native';

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
    const primaryActionTestID = isDefined(testID) ? `${testID}.PrimaryAction.${snapshot.state}` : testID;
    const statusTestID = isDefined(testID) ? `${testID}.Status.${snapshot.state}` : testID;
    const handlePress = () => {
        void handlePrimaryAction();
    };

    return (
        <>
            <HorizontalCell
                testID={testID}
                {...(!isWorking && { onPress: handlePress })}
                left={<CircleIcon icon={UserIconNameEnum.Database} variant="positive" border={false} size={36} iconSize={20} />}
                right={<Text className={`text-sm font-medium text-right w-12 ${STATE_TEXT_CLASS[snapshot.state]}`}>{percentText}</Text>}
                variant="secondary"
                align="top"
                contentClassName="gap-y-lg"
            >
                <View className="gap-y-xs">
                    <View className="flex-row items-center gap-x-sm">
                        <Text className="text-sm font-medium text-primary flex-1">{snapshot.title}</Text>
                        <Text testID={primaryActionTestID} className="text-xs font-semibold text-secondary-foreground">
                            {snapshot.primaryActionText}
                        </Text>
                    </View>
                    <Text testID={statusTestID} className="text-xs font-medium text-secondary-foreground">
                        {snapshot.statusText}
                    </Text>
                </View>

                <AiProgressBar progress={snapshot.percent} />

                <View className="gap-y-sm">
                    {snapshot.steps.map(step => {
                        const stepPercentText = `${step.percent}%`;

                        return (
                            <View key={step.key} className="gap-y-xs">
                                <View className="flex-row items-center gap-x-sm">
                                    <Text className="text-xs font-medium text-primary flex-1">{step.title}</Text>
                                    <Text className={`text-xs font-medium text-right w-10 ${STATE_TEXT_CLASS[step.state]}`}>
                                        {stepPercentText}
                                    </Text>
                                </View>
                                <View className="flex-row items-center gap-x-sm">
                                    <View className="flex-1">
                                        <AiProgressBar progress={step.percent} />
                                    </View>
                                    <Text className="text-xs font-medium text-secondary-foreground w-16 text-right">{step.statusText}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </HorizontalCell>

            <Modal transparent visible={isWorking} animationType="fade">
                <View className="flex-1 bg-primary/70 justify-center px-5xl">
                    <View className="bg-primary-reverse rounded-2xl p-5xl gap-y-3xl">
                        <ActivityIndicator size="large" color="var(--color-primary)" />
                        <View className="gap-y-sm">
                            <View className="flex-row items-center gap-x-lg">
                                <Text className="text-base font-semibold text-primary flex-1">{snapshot.title}</Text>
                                <Text className="text-base font-semibold text-primary">{percentText}</Text>
                            </View>
                            <AiProgressBar progress={snapshot.percent} />
                            <Text className="text-sm font-medium text-secondary-foreground">{snapshot.statusText}</Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

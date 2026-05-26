import { UserIconNameEnum } from '@budgie/contracts';
import { ActivityIndicator, Modal, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { AiProgressBar } from '../../../settings/components/ai-progress-bar/ai-progress-bar';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { MoneyDataUpgradeProgressStateEnum } from '../../enum/money-data-upgrade-progress-state.enum';
import { useMoneyDataUpgradeStatus } from '../../hook/use-money-data-upgrade-status.hook';

import type { ComponentProps } from 'react';

const STATE_TEXT_CLASS: Record<MoneyDataUpgradeProgressStateEnum, string> = {
    [MoneyDataUpgradeProgressStateEnum.READY]: 'text-secondary-foreground',
    [MoneyDataUpgradeProgressStateEnum.WORKING]: 'text-warning-foreground',
    [MoneyDataUpgradeProgressStateEnum.COMPLETE]: 'text-positive-foreground',
    [MoneyDataUpgradeProgressStateEnum.ERROR]: 'text-destructive-foreground'
};

export const MoneyDataUpgradeStatusCard = ({ testID }: Pick<ComponentProps<typeof SettingsCard>, 'testID'>) => {
    const { snapshot, handlePrimaryAction } = useMoneyDataUpgradeStatus();
    const percentText = `${snapshot.percent}%`;
    const isWorking = snapshot.state === MoneyDataUpgradeProgressStateEnum.WORKING;
    const isActionable =
        snapshot.state === MoneyDataUpgradeProgressStateEnum.READY || snapshot.state === MoneyDataUpgradeProgressStateEnum.ERROR;
    const primaryActionTestID = isDefined(testID) ? `${testID}.PrimaryAction.${snapshot.state}` : testID;
    const handlePress = () => {
        void handlePrimaryAction();
    };

    return (
        <>
            <SettingsCard
                testID={testID}
                {...(isActionable && { onPress: handlePress })}
                title={snapshot.title}
                description={snapshot.statusText}
                icon={UserIconNameEnum.Database}
                variant="positive"
                isLoading={isWorking}
                right={
                    <Text testID={primaryActionTestID} className={`text-xs font-semibold text-right ${STATE_TEXT_CLASS[snapshot.state]}`}>
                        {snapshot.primaryActionText}
                    </Text>
                }
            />

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

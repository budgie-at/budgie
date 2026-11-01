import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { cn } from '../../../@generic/utils/cn.util';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { AiProgressBar } from '../../../settings/components/ai-progress-bar/ai-progress-bar';
import { SettingsPillButton } from '../../../settings/components/settings-pill-button/settings-pill-button';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { MoneyDataUpgradeProgressStateEnum } from '../../enum/money-data-upgrade-progress-state.enum';
import { useMoneyDataUpgradeStatus } from '../../hook/use-money-data-upgrade-status.hook';

interface Props {
    readonly testID: string;
}

const STATE_TEXT_CLASS: Record<MoneyDataUpgradeProgressStateEnum, string> = {
    [MoneyDataUpgradeProgressStateEnum.READY]: 'text-secondary-foreground',
    [MoneyDataUpgradeProgressStateEnum.WORKING]: 'text-warning-foreground',
    [MoneyDataUpgradeProgressStateEnum.COMPLETE]: 'text-positive-foreground',
    [MoneyDataUpgradeProgressStateEnum.ERROR]: 'text-destructive-foreground'
};

export const MoneyDataUpgradeStatusCard = ({ testID }: Props) => {
    const { t } = useLingui();
    const { snapshot, handlePrimaryAction } = useMoneyDataUpgradeStatus();

    const isWorking = snapshot.state === MoneyDataUpgradeProgressStateEnum.WORKING;
    const isComplete = snapshot.state === MoneyDataUpgradeProgressStateEnum.COMPLETE;
    const isActionable = !isWorking && !isComplete;
    const statusText = isComplete ? t`All past amounts are converted` : snapshot.statusText;
    const actionLabel = snapshot.state === MoneyDataUpgradeProgressStateEnum.ERROR ? t`Retry` : t`Convert`;
    const stateClassName = STATE_TEXT_CLASS[snapshot.state];
    const handlePress = () => void handlePrimaryAction();
    const percent = (
        <Text {...testIDProps(testID, TestIDPartEnum.PERCENT)} className={cn('text-[15px] font-medium tabular-nums', stateClassName)}>
            {`${snapshot.percent}%`}
        </Text>
    );
    const progress = isWorking ? <AiProgressBar progress={snapshot.percent} /> : null;
    const accessory = isActionable ? <SettingsPillButton label={actionLabel} variant="secondary" /> : percent;
    const statusClassName = isWorking ? 'text-secondary-foreground' : stateClassName;

    return (
        <SettingsRow
            icon={UserIconNameEnum.History}
            variant="ghost"
            title={snapshot.title}
            testID={testID}
            {...(isActionable && { onPress: handlePress })}
            right={accessory}
            subtitle={
                <View className="gap-y-sm">
                    <Text
                        numberOfLines={2}
                        {...testIDProps(testID, TestIDPartEnum.STATUS, snapshot.state)}
                        className={cn('text-[13px] leading-[18px]', statusClassName)}
                    >
                        {statusText}
                    </Text>
                    {progress}
                </View>
            }
        />
    );
};

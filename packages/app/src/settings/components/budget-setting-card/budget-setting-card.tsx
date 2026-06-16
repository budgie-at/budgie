import { UserIconNameEnum } from '@budgie/contracts';

import { SettingSwitch } from '../setting-switch/setting-switch';
import { SettingsCard } from '../settings-card/settings-card';

interface Props {
    readonly description: string;
    readonly icon: UserIconNameEnum;
    readonly stateOffTestID: string;
    readonly stateOnTestID: string;
    readonly switchTestID: string;
    readonly testID: string;
    readonly title: string;
    readonly value: boolean;
    readonly variant: 'positive' | 'warning';
    readonly onValueChange: (next: boolean) => void;
}

export const BudgetSettingCard = ({
    description,
    icon,
    stateOffTestID,
    stateOnTestID,
    switchTestID,
    testID,
    title,
    value,
    variant,
    onValueChange
}: Props) => {
    const switchSlot = (
        <SettingSwitch
            value={value}
            onValueChange={onValueChange}
            testID={switchTestID}
            stateOnTestID={stateOnTestID}
            stateOffTestID={stateOffTestID}
        />
    );

    return <SettingsCard testID={testID} title={title} description={description} icon={icon} variant={variant} right={switchSlot} />;
};

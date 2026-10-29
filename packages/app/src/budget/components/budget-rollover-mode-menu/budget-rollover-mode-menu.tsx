import { BudgetRolloverModeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';
import { Text } from 'react-native';

import { ActionsMenu } from '../../../@generic/component/actions-menu/actions-menu';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetRolloverModeMenuItem } from '../budget-rollover-mode-menu-item/budget-rollover-mode-menu-item';

const TRIGGER_SLOP = 12;
const TRIGGER_HIT_SLOP = { top: 0, bottom: TRIGGER_SLOP, left: TRIGGER_SLOP, right: TRIGGER_SLOP };

const ROLLOVER_MODE_ICONS: Record<BudgetRolloverModeEnum, UserIconNameEnum> = {
    [BudgetRolloverModeEnum.NONE]: UserIconNameEnum.Ban,
    [BudgetRolloverModeEnum.SURPLUS]: UserIconNameEnum.PiggyBank,
    [BudgetRolloverModeEnum.SURPLUS_AND_DEFICIT]: UserIconNameEnum.RefreshCw
};
const ROLLOVER_MODES = Object.values(BudgetRolloverModeEnum);
const TRIGGER_CLASS_NAME = cn('flex-row', 'items-center', 'gap-x-xs', 'py-xs');

interface Props {
    readonly name: `categoryLimits.${number}.rolloverMode` | 'otherRolloverMode';
}

export const BudgetRolloverModeMenu = ({ name }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFormValues>();
    const labels: Record<BudgetRolloverModeEnum, string> = {
        [BudgetRolloverModeEnum.NONE]: t`Off`,
        [BudgetRolloverModeEnum.SURPLUS]: t`Carry savings`,
        [BudgetRolloverModeEnum.SURPLUS_AND_DEFICIT]: t`Carry all`
    };

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, Props['name']>) => {
        const currentLabel = labels[value];

        const trigger = (
            <>
                <Text className="text-xs text-secondary-foreground">{t`Rollover: ${currentLabel}`}</Text>
                <Icon icon={UserIconNameEnum.ChevronDown} size={12} className="text-secondary-foreground" />
            </>
        );

        return (
            <ActionsMenu
                hitSlop={TRIGGER_HIT_SLOP}
                trigger={trigger}
                triggerClassName={TRIGGER_CLASS_NAME}
                accessibilityLabel={t`Rollover, ${currentLabel}. Double tap to change.`}
            >
                {ROLLOVER_MODES.map(mode => (
                    <BudgetRolloverModeMenuItem
                        key={mode}
                        icon={ROLLOVER_MODE_ICONS[mode]}
                        label={labels[mode]}
                        mode={mode}
                        onChange={onChange}
                        selectedMode={value}
                    />
                ))}
            </ActionsMenu>
        );
    };

    return <Controller control={control} name={name} render={render} />;
};

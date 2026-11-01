import { BudgetRolloverModeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { ActionsMenu } from '../../../@generic/component/actions-menu/actions-menu';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetCategoryLimitLabel } from '../budget-category-limit-label/budget-category-limit-label';
import { BudgetRolloverModeMenuItem } from '../budget-rollover-mode-menu-item/budget-rollover-mode-menu-item';

import type { UserIconType } from '@budgie/contracts';

const ROLLOVER_MODE_ICONS: Record<BudgetRolloverModeEnum, UserIconNameEnum> = {
    [BudgetRolloverModeEnum.NONE]: UserIconNameEnum.Ban,
    [BudgetRolloverModeEnum.SURPLUS]: UserIconNameEnum.PiggyBank,
    [BudgetRolloverModeEnum.SURPLUS_AND_DEFICIT]: UserIconNameEnum.RefreshCw
};
const ROLLOVER_MODES = Object.values(BudgetRolloverModeEnum);

interface Props {
    readonly name: `categoryLimits.${number}.rolloverMode` | 'otherRolloverMode';
    readonly icon: UserIconType;
    readonly title: string;
    readonly testID: string;
}

export const BudgetRolloverModeMenu = ({ name, icon, title, testID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFormValues>();
    const labels: Record<BudgetRolloverModeEnum, string> = {
        [BudgetRolloverModeEnum.NONE]: t`Off`,
        [BudgetRolloverModeEnum.SURPLUS]: t`Carry savings`,
        [BudgetRolloverModeEnum.SURPLUS_AND_DEFICIT]: t`Carry all`
    };

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, Props['name']>) => {
        const currentLabel = labels[value];

        const trigger = <BudgetCategoryLimitLabel icon={icon} title={title} testID={testID} menuValue={t`Rollover · ${currentLabel}`} />;

        return (
            <ActionsMenu
                hitSlop={0}
                trigger={trigger}
                triggerClassName="active:opacity-70"
                accessibilityLabel={t`${title}, rollover ${currentLabel}. Double tap to change.`}
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

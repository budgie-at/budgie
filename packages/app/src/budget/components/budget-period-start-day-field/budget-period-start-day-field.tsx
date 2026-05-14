import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

const MIN_PERIOD_START_DAY = 1;
const MAX_PERIOD_START_DAY = 28;

interface Props {
    readonly control: Control<BudgetFormValues>;
}

const parsePeriodStartDay = (raw: string): number => {
    const parsed = Number(raw);

    if (Number.isNaN(parsed)) {
        return MIN_PERIOD_START_DAY;
    }

    return Math.min(Math.max(parsed, MIN_PERIOD_START_DAY), MAX_PERIOD_START_DAY);
};

export const BudgetPeriodStartDayField = ({ control }: Props) => {
    const { t } = useLingui();

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, 'periodStartDay'>) => {
        const handleChange = (raw: string) => void onChange(parsePeriodStartDay(raw));

        return (
            <FormItem label={t`Period start day (1–28)`}>
                <Input size="lg" keyboardType="number-pad" value={String(value)} onChangeText={handleChange} placeholder={t`1`} />
            </FormItem>
        );
    };

    return <Controller control={control} name="periodStartDay" render={render} />;
};

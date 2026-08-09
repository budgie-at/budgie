import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useDatePickerModal } from '../../../transaction/context/date-picker-modal.context';
import { DepositAccountFormValues } from '../../interface/deposit-account-form-values.interface';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

interface Props {
    readonly control: Control<DepositAccountFormValues>;
    readonly variant: ColorPaletteVariant;
}

export const DepositMaturityDateField = ({ control, variant }: Props) => {
    const { t } = useLingui();
    const { formatDayAndFullMonthAndYear } = useFormatDate();
    const [openDatePicker] = useDatePickerModal();

    const render = ({ field: { value, onChange } }: UseControllerReturn<DepositAccountFormValues, 'deadline'>) => {
        const fieldVariant = isDefined(value) ? variant : 'secondary';
        const description = isDefined(value) ? t`Expected maturity date` : t`When does the deposit mature?`;
        const title = isDefined(value) ? formatDayAndFullMonthAndYear(value) : t`Set Maturity Date`;

        const handleOpen = async () => {
            const result = await openDatePicker({ initialDate: value ?? new Date() });

            if (isDefined(result)) {
                onChange(result);
            }
        };

        return (
            <FormItem className="w-auto" label={t`Maturity Date (Optional)`}>
                <SimpleHorizontalCell
                    left={<CircleIcon icon={UserIconNameEnum.Calendar} variant={fieldVariant} />}
                    onPress={handleOpen}
                    title={title}
                    description={description}
                    singleLine
                    testID={CreateAccountScreenSelector.MaturityDateButton}
                />
            </FormItem>
        );
    };

    return <Controller render={render} name="deadline" control={control} />;
};

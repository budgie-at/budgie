import { useLingui } from '@lingui/react/macro';
import { Control, Controller, Path, UseControllerReturn } from 'react-hook-form';

import { DatePickerBottomSheet } from '../../../@generic/components/date-picker-bottom-sheet/date-picker-bottom-sheet';
import { FormItem } from '../../../@generic/components/form-item/form-item';
import { FormLayoutGroup } from '../../../@generic/components/form-layout-group/form-layout-group';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { TagsSelector } from '../../../tag/components/tags-selector/tags-selector';

interface Props<T extends { operatedAt: Date | string }> {
    readonly control: Control<T>;
    readonly variant: ColorPaletteVariant;
}

export const TransactionDateAndTags = <T extends { operatedAt: Date | string }>(props: Props<T>) => {
    const { control, variant } = props;

    const { t } = useLingui();

    const render = ({ field: { onChange, value } }: UseControllerReturn<T>) => (
        <DatePickerBottomSheet variant={variant} date={new Date(value)} onChange={onChange} />
    );

    return (
        <FormLayoutGroup variant="horizontal">
            <FormItem className="w-auto flex-1" label={t`Date`}>
                <Controller name={'operatedAt' as Path<T>} control={control} render={render} />
            </FormItem>

            <FormItem className="w-auto flex-1" label={t`Tags`}>
                <TagsSelector variant={variant} />
            </FormItem>
        </FormLayoutGroup>
    );
};

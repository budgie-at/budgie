import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/components/form-item/form-item';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { TagsSelector } from '../../../tag/components/tags-selector/tags-selector';

interface Props {
    readonly control: Control<TransactionCreateInputInterface>;
    readonly variant: ColorPaletteVariant;
}

export const TransactionFormTagsField = ({ control, variant }: Props) => {
    const { t } = useLingui();

    const renderTagsSelector = ({ field: { value, onChange } }: UseControllerReturn<TransactionCreateInputInterface, 'tagIds'>) => (
        <FormItem className="w-auto flex-1" label={t`Tags`}>
            <TagsSelector tagIds={value} onChange={onChange} variant={variant} />
        </FormItem>
    );

    return <Controller render={renderTagsSelector} name="tagIds" control={control} />;
};

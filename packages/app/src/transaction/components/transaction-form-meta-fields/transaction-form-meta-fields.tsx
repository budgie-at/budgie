import { TransactionCreateInputInterface } from '@budgie/contracts';
import { Control } from 'react-hook-form';

import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { TransactionFormDateField } from '../transaction-form-date-field/transaction-form-date-field';
import { TransactionFormTagsField } from '../transaction-form-tags-field/transaction-form-tags-field';

interface Props {
    readonly control: Control<TransactionCreateInputInterface>;
    readonly variant: ColorPaletteVariant;
}

export const TransactionFormMetadataFields = ({ control, variant }: Props) => (
    <FormLayoutGroup variant="horizontal">
        <TransactionFormDateField control={control} variant={variant} />
        <TransactionFormTagsField control={control} variant={variant} />
    </FormLayoutGroup>
);

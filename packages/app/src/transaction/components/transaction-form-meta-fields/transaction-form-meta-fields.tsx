import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { TransactionFormDateField } from '../transaction-form-date-field/transaction-form-date-field';
import { TransactionFormTagsField } from '../transaction-form-tags-field/transaction-form-tags-field';

interface Props {
    readonly variant: ColorPaletteVariant;
}

export const TransactionFormMetadataFields = ({ variant }: Props) => (
    <FormLayoutGroup variant="horizontal">
        <TransactionFormDateField variant={variant} />
        <TransactionFormTagsField variant={variant} />
    </FormLayoutGroup>
);

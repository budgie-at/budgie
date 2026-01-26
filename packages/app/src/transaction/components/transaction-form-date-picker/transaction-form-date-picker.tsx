import { isDefined } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { TransactionFormDatePickerEmbedded } from '../transaction-form-date-picker-embedded/transaction-form-date-picker-embedded';
import { TransactionFormDatePickerStandalone } from '../transaction-form-date-picker-standalone/transaction-form-date-picker-standalone';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly onClose?: () => void;
    readonly date?: Date;
    readonly onChange?: (date: Date) => void;
}

export const TransactionFormDatePicker = ({ variant, onClose, date, onChange }: Props) => {
    if (isDefined(onClose)) {
        return <TransactionFormDatePickerEmbedded onClose={onClose} />;
    }

    if (isDefined(date) && isDefined(onChange)) {
        return <TransactionFormDatePickerStandalone date={date} onChange={onChange} variant={variant} />;
    }

    return null;
};

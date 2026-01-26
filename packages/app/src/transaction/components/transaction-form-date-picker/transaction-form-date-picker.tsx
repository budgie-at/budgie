import { isDefined } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { TransactionFormDatePickerEmbedded } from '../transaction-form-date-picker-embedded/transaction-form-date-picker-embedded';
import { TransactionFormDatePickerStandalone } from '../transaction-form-date-picker-standalone/transaction-form-date-picker-standalone';

interface EmbeddedProps {
    readonly variant?: ColorPaletteVariant;
    readonly value: Date;
    readonly onChange: (date: Date) => void;
    readonly onClose: () => void;
    readonly date?: never;
}

interface StandaloneProps {
    readonly variant: ColorPaletteVariant;
    readonly date: Date;
    readonly onChange: (date: Date) => void;
    readonly onClose?: never;
    readonly value?: never;
}

type Props = EmbeddedProps | StandaloneProps;

export const TransactionFormDatePicker = (props: Props) => {
    if (isDefined(props.onClose) && isDefined(props.value)) {
        return <TransactionFormDatePickerEmbedded value={props.value} onChange={props.onChange} onClose={props.onClose} />;
    }

    if (isDefined(props.date) && isDefined(props.variant)) {
        return <TransactionFormDatePickerStandalone date={props.date} onChange={props.onChange} variant={props.variant} />;
    }

    return null;
};

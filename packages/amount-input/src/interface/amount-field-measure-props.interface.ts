import type { AmountFieldTextPropsInterface } from './amount-field-text-props.interface';

export interface AmountFieldMeasurePropsInterface extends Pick<AmountFieldTextPropsInterface, 'style' | 'className'> {
    readonly text: string;
    readonly scale: number;
    readonly extraWidth: number;
}

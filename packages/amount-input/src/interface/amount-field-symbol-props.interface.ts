import type { AmountFieldTextPropsInterface } from './amount-field-text-props.interface';

export interface AmountFieldSymbolPropsInterface extends AmountFieldTextPropsInterface {
    readonly scale?: number;
}

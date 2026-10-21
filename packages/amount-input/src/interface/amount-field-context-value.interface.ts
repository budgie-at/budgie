import type { AmountFieldPartWidthActionInterface } from './amount-field-part-width-action.interface';
import type { Dispatch } from 'react';

export interface AmountFieldContextValueInterface {
    readonly fontSize: number;
    readonly baseFontSize: number;
    readonly contentOpacity: number;
    readonly dispatchPartWidth: Dispatch<AmountFieldPartWidthActionInterface>;
}

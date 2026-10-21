import type { AmountFieldPartWidthInterface } from './amount-field-part-width.interface';

export interface AmountFieldPartWidthActionInterface {
    readonly partId: string;
    readonly partWidth: AmountFieldPartWidthInterface | null;
}

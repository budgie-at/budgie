import { ConvertedAmountInterface } from './converted-amount.interface';

export interface ConvertedAmountStateInterface {
    readonly fromInstrumentId: number;
    readonly toInstrumentId: number;
    readonly amountInMicroUnits: number;
    readonly result: ConvertedAmountInterface | null;
}

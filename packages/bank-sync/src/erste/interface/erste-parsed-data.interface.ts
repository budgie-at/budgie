import type { ErsteAccountInfoInterface } from './erste-account-info.interface';
import type { ErsteRowInterface } from './erste-row.interface';

export interface ErsteParsedDataInterface {
    readonly account: ErsteAccountInfoInterface;
    readonly transactions: ErsteRowInterface[];
}

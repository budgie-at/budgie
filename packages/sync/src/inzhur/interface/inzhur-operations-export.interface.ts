import type { InzhurOperationInterface } from './inzhur-operation.interface';
import type { InzhurUnrecognisedOperationInterface } from './inzhur-unrecognised-operation.interface';

export interface InzhurOperationsExportInterface {
    readonly operations: readonly InzhurOperationInterface[];
    readonly unrecognised: readonly InzhurUnrecognisedOperationInterface[];
}

import type { AccountEntityInterface } from '@budgie/contracts';

export interface InzhurFundPlanInterface {
    readonly isin: string;
    readonly name: string;
    readonly account: AccountEntityInterface;
    readonly deltaMicroUnits: number;
    readonly price: number | null;
    readonly valueMicroUnits: number;
}

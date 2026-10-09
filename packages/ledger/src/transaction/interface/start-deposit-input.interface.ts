import type { DepositAccountCreateInputInterface } from '@budgie/contracts';

export interface StartDepositInputInterface extends Pick<
    DepositAccountCreateInputInterface,
    'title' | 'icon' | 'instrumentId' | 'interestRate' | 'deadline' | 'includeInNetWorth'
> {
    readonly receivingAmount: number;
}

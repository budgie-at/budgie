import { DepositAccountCreateInputInterface } from '@budgie/contracts';

export interface DepositAccountFormValues extends Omit<DepositAccountCreateInputInterface, 'deadline' | 'interestRate'> {
    readonly deadline: Date | null;
    readonly interestRate: number | null;
}

import type { AccountEntityInterface } from '@budgie/contracts';

export interface OnboardingBalanceInputInterface {
    readonly account: Pick<AccountEntityInterface, 'id' | 'type'>;
    readonly balance: number;
}

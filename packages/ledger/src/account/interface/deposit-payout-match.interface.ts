import type { DepositPayoutCandidateInterface } from './deposit-payout-candidate.interface';
import type { DepositPayoutTargetInterface } from './deposit-payout-target.interface';

export interface DepositPayoutMatchInterface {
    readonly deposit: DepositPayoutTargetInterface;
    readonly payout: DepositPayoutCandidateInterface;
    readonly amount: number;
    readonly rank: number;
    readonly distance: number;
}

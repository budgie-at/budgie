import type { InzhurLinkedPaymentsInterface } from './inzhur-linked-payments.interface';

export interface InzhurBankFlowSummaryInterface extends InzhurLinkedPaymentsInterface {
    readonly preSetupCashDelta: number;
}

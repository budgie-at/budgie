import type { InzhurPurchaseFormValues } from '../constant/inzhur-purchase-form-schema.constant';
import type { InzhurPendingTopUpInterface } from '@budgie/sync';

export const buildInzhurPurchaseDefaults = (
    topUp: Pick<InzhurPendingTopUpInterface, 'remainingAmount' | 'operatedAt'>
): InzhurPurchaseFormValues => ({
    fundName: '',
    certificates: 0,
    amount: topUp.remainingAmount,
    operatedAt: topUp.operatedAt
});

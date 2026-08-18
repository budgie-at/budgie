import { testDb, testQueryService, testSeedService } from './test-context';

import type { AccountEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

export const IBAN_BRIDGE_SOURCE_IBAN = 'UA-RECLAIM-SOURCE-EUR';
export const IBAN_BRIDGE_TARGET_IBAN = 'UA-RECLAIM-TARGET-UAH';
const IBAN_BRIDGE_BRIDGE_IBAN = 'UA-RECLAIM-BRIDGE-UAH';
export const IBAN_BRIDGE_EUR_AMOUNT = 1_658_290_000;
export const IBAN_BRIDGE_UAH_AMOUNT = 84_456_700_000;
export const IBAN_BRIDGE_UAH_TO_EUR_RATE = IBAN_BRIDGE_EUR_AMOUNT / IBAN_BRIDGE_UAH_AMOUNT;
const IBAN_BRIDGE_EUR_TO_UAH_RATE = IBAN_BRIDGE_UAH_AMOUNT / IBAN_BRIDGE_EUR_AMOUNT;
export const IBAN_BRIDGE_OPERATED_AT = new Date('2026-05-20T18:38:00');
export const IBAN_BRIDGE_TRANSFER_MCC = '4829';

export const seedIbanBridgeTopology = (): {
    readonly bridgeAccount: AccountEntityInterface;
    readonly sourceAccount: AccountEntityInterface;
    readonly targetAccount: AccountEntityInterface;
    readonly transferMccId: number;
} => {
    const eur = testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: 'EUR' });

    return {
        sourceAccount: testSeedService.bankSyncAccount('Reclaim Source EUR', null, IBAN_BRIDGE_SOURCE_IBAN, eur.id),
        bridgeAccount: testSeedService.bankSyncAccount('Reclaim Bridge UAH', null, IBAN_BRIDGE_BRIDGE_IBAN),
        targetAccount: testSeedService.bankSyncAccount('Reclaim Target UAH', null, IBAN_BRIDGE_TARGET_IBAN),
        transferMccId: testQueryService.findMccByCode(IBAN_BRIDGE_TRANSFER_MCC).id
    };
};

export const seedIbanBridgeIncomeLeg = (bridgeAccountId: number, transferMccId: number): TransactionEntityInterface =>
    testSeedService.bankPairIncome(
        { externalId: 'reclaim-bridge-income', operatedAt: IBAN_BRIDGE_OPERATED_AT },
        {
            accountId: bridgeAccountId,
            amount: IBAN_BRIDGE_UAH_AMOUNT,
            exchangeRate: IBAN_BRIDGE_EUR_TO_UAH_RATE,
            mccCategoryId: transferMccId,
            toIban: IBAN_BRIDGE_SOURCE_IBAN
        }
    );

const seedIbanBridgeExpenseLeg = (bridgeAccountId: number, transferMccId: number): TransactionEntityInterface =>
    testSeedService.bankPairExpense(
        { externalId: 'reclaim-bridge-expense', operatedAt: IBAN_BRIDGE_OPERATED_AT },
        {
            accountId: bridgeAccountId,
            amount: IBAN_BRIDGE_UAH_AMOUNT,
            mccCategoryId: transferMccId,
            toIban: IBAN_BRIDGE_TARGET_IBAN
        }
    );

export const seedIbanBridgeLegs = (
    bridgeAccountId: number,
    transferMccId: number
): {
    readonly bridgeExpense: TransactionEntityInterface;
    readonly bridgeIncome: TransactionEntityInterface;
} => ({
    bridgeIncome: seedIbanBridgeIncomeLeg(bridgeAccountId, transferMccId),
    bridgeExpense: seedIbanBridgeExpenseLeg(bridgeAccountId, transferMccId)
});

export const seedIbanBridgeSourceExpense = (sourceAccountId: number, transferMccId: number): TransactionEntityInterface =>
    testSeedService.bankPairExpense(
        { externalId: 'reclaim-source-expense', operatedAt: IBAN_BRIDGE_OPERATED_AT },
        {
            accountId: sourceAccountId,
            amount: IBAN_BRIDGE_EUR_AMOUNT,
            exchangeRate: IBAN_BRIDGE_UAH_TO_EUR_RATE,
            mccCategoryId: transferMccId,
            toIban: IBAN_BRIDGE_TARGET_IBAN
        }
    );

export const seedIbanBridgeTargetIncome = (targetAccountId: number, transferMccId: number): TransactionEntityInterface =>
    testSeedService.bankPairIncome(
        { externalId: 'reclaim-target-income', operatedAt: IBAN_BRIDGE_OPERATED_AT },
        {
            accountId: targetAccountId,
            amount: IBAN_BRIDGE_UAH_AMOUNT,
            mccCategoryId: transferMccId
        }
    );

export const parentConsolidationSource = async (sourceTransactionId: number, canonicalTransactionId: number): Promise<void> => {
    await testDb.$client.runAsync(
        'UPDATE transaction_entries SET original_transaction_id = ?, transaction_id = ? WHERE transaction_id = ?',
        [sourceTransactionId, canonicalTransactionId, sourceTransactionId]
    );
    await testDb.$client.runAsync('UPDATE transactions SET consolidation_parent_transaction_id = ? WHERE id = ?', [
        canonicalTransactionId,
        sourceTransactionId
    ]);
};

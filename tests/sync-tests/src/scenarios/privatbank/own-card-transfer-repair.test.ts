import { unpairedOwnCardTransferRepairService } from '@app/sync/service/unpaired-own-card-transfer-repair.service';
import { transactionTransferService } from '@app/transaction/service/transaction-transfer.service';
import {
    AccountEntityTable,
    AccountTypeEnum,
    ExternalSourceEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

import { fetchTransactionById, seed, testDb } from '../../harness';

import type { AccountEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

const OWN_CARD_INCOME_TITLE = 'Зі своєї картки *4321';
const OWN_CARD_EXPENSE_TITLE = 'На мою картку *1234';
const THIRD_PARTY_CARD_TITLE = 'Переказ на картку';
const UNKNOWN_CARD_INCOME_TITLE = 'Зі своєї картки *9999';
const OWN_CARD_AMOUNT = 10_000_000_000;
const OWN_CARD_FEE_AMOUNT = 25_000_000;
const OWN_CARD_OPERATED_AT = new Date('2026-03-04T09:15:00.000Z');
const CONVERSION_FAILURE_MESSAGE = 'conversion failed';

const seedPrivatbankCard = (cardEnding: string): AccountEntityInterface =>
    seed.account({
        title: `Privatbank •${cardEnding}`,
        type: AccountTypeEnum.BANK_SYNC,
        externalSource: ExternalSourceEnum.PRIVATBANK,
        externalId: `4000 **** **** ${cardEnding}`,
        iban: `UA00PRIVATBANK${cardEnding}`
    });

const archiveAccount = (accountId: number): void => {
    testDb.update(AccountEntityTable).set({ deletedAt: new Date() }).where(eq(AccountEntityTable.id, accountId)).run();
};

const seedOwnCardIncome = (accountId: number, title: string = OWN_CARD_INCOME_TITLE): TransactionEntityInterface => {
    const income = seed.bankPairIncome(
        { externalId: 'privatbank-own-card-income', operatedAt: OWN_CARD_OPERATED_AT },
        { accountId, amount: OWN_CARD_AMOUNT }
    );

    return seed.updateTransaction(income.id, { externalSource: ExternalSourceEnum.PRIVATBANK, title });
};

const softDeleteTransaction = (transactionId: number): void => {
    const deletedAt = new Date();

    testDb.update(TransactionEntityTable).set({ deletedAt }).where(eq(TransactionEntityTable.id, transactionId)).run();
    testDb.update(TransactionEntryEntityTable).set({ deletedAt }).where(eq(TransactionEntryEntityTable.transactionId, transactionId)).run();
};

const seedOwnCardCounterpartExpense = (accountId: number): TransactionEntityInterface => {
    const expense = seed.bankPairExpense(
        { externalId: 'privatbank-own-card-expense', operatedAt: OWN_CARD_OPERATED_AT },
        { accountId, amount: OWN_CARD_AMOUNT }
    );

    return seed.updateTransaction(expense.id, { externalSource: ExternalSourceEnum.PRIVATBANK, title: OWN_CARD_EXPENSE_TITLE });
};

const seedArchivedOwnCardScenario = (): {
    readonly archivedCard: AccountEntityInterface;
    readonly income: TransactionEntityInterface;
    readonly liveCard: AccountEntityInterface;
} => {
    const liveCard = seedPrivatbankCard('1234');
    const archivedCard = seedPrivatbankCard('4321');
    const income = seedOwnCardIncome(liveCard.id);

    archiveAccount(archivedCard.id);

    return { archivedCard, income, liveCard };
};

const seedArchivedCardWithMask = (externalId: string | null, iban: string): AccountEntityInterface => {
    const archivedCard = seed.account({
        title: 'Privatbank •4321',
        type: AccountTypeEnum.BANK_SYNC,
        externalSource: ExternalSourceEnum.PRIVATBANK,
        externalId,
        iban
    });

    archiveAccount(archivedCard.id);

    return archivedCard;
};

const expectRepairedFromCounterpart = async (archivedCard: AccountEntityInterface, income: TransactionEntityInterface): Promise<void> => {
    expect(await unpairedOwnCardTransferRepairService.countCandidates()).toBe(1);
    expect(await unpairedOwnCardTransferRepairService.repair()).toBe(1);
    expect(fetchTransactionById(income.id).fromAccountId).toBe(archivedCard.id);
};

describe('privatbank/own-card-transfer-repair', () => {
    it('repairs an own-card income whose counterpart card account was archived', async () => {
        const { archivedCard, income, liveCard } = seedArchivedOwnCardScenario();

        expect(await unpairedOwnCardTransferRepairService.countCandidates()).toBe(1);
        expect(await unpairedOwnCardTransferRepairService.repair()).toBe(1);

        const repaired = fetchTransactionById(income.id);

        expect(repaired.type).toBe(TransactionTypeEnum.TRANSFER);
        expect(repaired.fromAccountId).toBe(archivedCard.id);
        expect(repaired.toAccountId).toBe(liveCard.id);
    });

    it('leaves nothing to repair after a first repair pass', async () => {
        seedArchivedOwnCardScenario();

        await unpairedOwnCardTransferRepairService.repair();

        expect(await unpairedOwnCardTransferRepairService.countCandidates()).toBe(0);
        expect(await unpairedOwnCardTransferRepairService.repair()).toBe(0);
    });

    it('counts an own-card income with a fee entry once', async () => {
        const liveCard = seedPrivatbankCard('1234');
        const archivedCard = seedPrivatbankCard('4321');
        const income = seedOwnCardIncome(liveCard.id);

        seed.feeEntry(income.id, 'privatbank-own-card-income-fee', { accountId: liveCard.id, amount: OWN_CARD_FEE_AMOUNT });
        archiveAccount(archivedCard.id);

        expect(await unpairedOwnCardTransferRepairService.countCandidates()).toBe(1);
        expect(await unpairedOwnCardTransferRepairService.repair()).toBe(1);
    });

    it('ignores a maskless third-party card transfer', async () => {
        const liveCard = seedPrivatbankCard('1234');
        const archivedCard = seedPrivatbankCard('4321');
        const expense = seed.bankPairExpense(
            { externalId: 'privatbank-third-party-expense', operatedAt: OWN_CARD_OPERATED_AT },
            { accountId: liveCard.id, amount: OWN_CARD_AMOUNT }
        );

        seed.updateTransaction(expense.id, { externalSource: ExternalSourceEnum.PRIVATBANK, title: THIRD_PARTY_CARD_TITLE });
        archiveAccount(archivedCard.id);

        expect(await unpairedOwnCardTransferRepairService.countCandidates()).toBe(0);
    });

    it('repairs an own-card income whose counterpart leg was archived together with the card', async () => {
        const liveCard = seedPrivatbankCard('1234');
        const archivedCard = seedPrivatbankCard('4321');
        const income = seedOwnCardIncome(liveCard.id);

        softDeleteTransaction(seedOwnCardCounterpartExpense(archivedCard.id).id);
        archiveAccount(archivedCard.id);

        expect(await unpairedOwnCardTransferRepairService.countCandidates()).toBe(1);
        expect(await unpairedOwnCardTransferRepairService.repair()).toBe(1);
        expect(fetchTransactionById(income.id).fromAccountId).toBe(archivedCard.id);
    });

    it('ignores an own-card income whose card mask resolves to no archived account', async () => {
        const liveCard = seedPrivatbankCard('1234');
        const archivedCard = seedPrivatbankCard('4321');

        seedOwnCardIncome(liveCard.id, UNKNOWN_CARD_INCOME_TITLE);
        archiveAccount(archivedCard.id);

        expect(await unpairedOwnCardTransferRepairService.countCandidates()).toBe(0);
    });

    it('rejects when a candidate conversion fails', async () => {
        seedArchivedOwnCardScenario();

        const convertSpy = vi
            .spyOn(transactionTransferService, 'convertIncomeToTransfer')
            .mockRejectedValue(new Error(CONVERSION_FAILURE_MESSAGE));

        try {
            await expect(unpairedOwnCardTransferRepairService.repair()).rejects.toThrow(CONVERSION_FAILURE_MESSAGE);
        } finally {
            convertSpy.mockRestore();
        }

        expect(await unpairedOwnCardTransferRepairService.countCandidates()).toBe(1);
    });

    it('ignores an own-card income that still has a live counterpart leg', async () => {
        const liveCard = seedPrivatbankCard('1234');
        const archivedCard = seedPrivatbankCard('4321');

        seedOwnCardIncome(liveCard.id);
        seedOwnCardCounterpartExpense(archivedCard.id);
        archiveAccount(archivedCard.id);

        expect(await unpairedOwnCardTransferRepairService.countCandidates()).toBe(0);
    });

    it('matches the counterpart card by external_id when its IBAN suffix differs', async () => {
        const liveCard = seedPrivatbankCard('1234');
        const archivedCard = seedArchivedCardWithMask('4000 **** **** 4321', 'UA00PRIVATBANK9999');
        const income = seedOwnCardIncome(liveCard.id);

        await expectRepairedFromCounterpart(archivedCard, income);
    });

    it('falls back to the IBAN suffix when the counterpart card has no external_id', async () => {
        const liveCard = seedPrivatbankCard('1234');
        const archivedCard = seedArchivedCardWithMask(null, 'UA00PRIVATBANK4321');
        const income = seedOwnCardIncome(liveCard.id);

        await expectRepairedFromCounterpart(archivedCard, income);
    });
});

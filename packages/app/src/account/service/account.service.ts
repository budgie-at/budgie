import {
    AccountCreateEntityInterface,
    AccountEntityInterface,
    AccountUpdateEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isDefined, isNumber } from '@rnw-community/shared';

import { ZERO_AMOUNT } from '../../@generic/constant/zero-amount.constant';
import {
    accountBalanceRepository,
    accountRepository,
    db,
    transactionEntryRepository,
    transactionRepository
} from '../../@generic/drizzle/db/db';
import { Transaction } from '../../@generic/type/transaction.type';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';

class AccountService {
    async create({ currentBalance, ...input }: AccountCreateEntityInterface): Promise<AccountEntityInterface> {
        return db.transaction(async tx => {
            const account = await accountRepository.create(
                {
                    ...input,
                    currentBalance: Number(convertToMicroUnits(currentBalance))
                },
                tx
            );

            if (isNumber(currentBalance) && currentBalance !== 0) {
                await this.adjustBalanceTo(account.id, account.instrumentId, currentBalance, tx);
            }

            return account;
        });
    }

    async updateById(id: number, { currentBalance, ...input }: AccountUpdateEntityInterface): Promise<AccountEntityInterface> {
        return db.transaction(async tx => {
            const [{ balance }] = await accountRepository.getAccountBalance(id);
            const account = await accountRepository.updateById(
                id,
                {
                    ...input,
                    ...(isDefined(currentBalance) ? { currentBalance: Number(convertToMicroUnits(currentBalance)) } : {})
                },
                tx
            );

            if (isNumber(currentBalance) && convertToMicroUnits(currentBalance) !== balance) {
                await this.adjustBalanceTo(account.id, account.instrumentId, currentBalance, tx);
            }

            return account;
        });
    }

    private async adjustBalanceTo(accountId: number, instrumentId: number, targetBalance: number, tx: Transaction): Promise<void> {
        const [latestSnapshot] = await accountBalanceRepository.getLatestSnapshots([accountId]);
        const lastBalance = isDefined(latestSnapshot) ? BigInt(latestSnapshot.amount) : ZERO_AMOUNT;
        const targetInSmallestUnits = convertToMicroUnits(targetBalance);

        const delta = targetInSmallestUnits - lastBalance;

        if (delta === ZERO_AMOUNT) {
            return;
        }

        const isDebit = delta > ZERO_AMOUNT;
        const absDelta = Math.abs(Number(delta));

        const transaction = await transactionRepository.create(
            {
                type: TransactionTypeEnum.ADJUSTMENT,
                title: '',
                tagIds: [],
                entries: [],
                comment: '',
                exchangeRate: 1,
                externalId: null,
                amount: absDelta,
                externalSource: null,
                operatedAt: new Date(),
                toAccountId: isDebit ? accountId : null,
                fromAccountId: isDebit ? null : accountId
            },
            tx
        );

        await transactionEntryRepository.create(
            {
                accountId,
                instrumentId,
                categoryId: null,
                amount: absDelta,
                transactionId: transaction.id,
                type: isDebit ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT
            },
            tx
        );

        await accountBalanceRepository.insertSnapshots(
            [
                {
                    accountId,
                    amount: absDelta,
                    parentAccountId: accountId
                }
            ],
            tx
        );
    }
}

export const accountService = new AccountService();

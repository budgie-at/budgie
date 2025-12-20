import { convertToMicroUnits } from '../@generic/util/convert-to-micro-units.util';
import { ExternalSourceEnum } from '../account/enum/external-source.enum';
import { ExpenseTransactionCreateEntityInterface } from '../transaction/entity/expense-transaction-create-entity.interface';
import { TransactionTypeEnum } from '../transaction/enum/transaction-type.enum';

const [externalSource] = Object.values(ExternalSourceEnum);

export const createExpenseTransactionInput = (
    input: Partial<ExpenseTransactionCreateEntityInterface>
): ExpenseTransactionCreateEntityInterface => ({
    type: TransactionTypeEnum.EXPENSE,
    title: 'Expense',
    comment: '',
    externalId: null,
    operatedAt: new Date(),
    exchangeRate: convertToMicroUnits(1),
    externalSource,
    toAccountId: null,
    fromAccountId: 42,
    amount: BigInt(0),
    ...input
});

import { convertToMicroUnits } from '../@generic/util/convert-to-micto-units.util';
import { ExternalSourceEnum } from '../account/enum/external-source.enum';
import { ExpenseTransactionCreateEntityInterface } from '../transaction/entity/expense-transaction-create-entity.interface';
import { TransactionAssociationEnum } from '../transaction/enum/transaction-association.enum';
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
    tagIds: [],
    [TransactionAssociationEnum.ENTRIES]: [],
    ...input
});

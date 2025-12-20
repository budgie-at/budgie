import { convertToMicroUnits } from '../@generic/util/convert-to-micto-units.util';
import { ExternalSourceEnum } from '../account/enum/external-source.enum';
import { IncomeTransactionCreateEntityInterface } from '../transaction/entity/income-transaction-create-entity.interface';
import { TransactionAssociationEnum } from '../transaction/enum/transaction-association.enum';
import { TransactionTypeEnum } from '../transaction/enum/transaction-type.enum';

const [externalSource] = Object.values(ExternalSourceEnum);

export const createIncomeTransactionInput = (input: Partial<IncomeTransactionCreateEntityInterface>): IncomeTransactionCreateEntityInterface => ({
    type: TransactionTypeEnum.INCOME,
    title: 'Income',
    comment: '',
    externalId: null,
    operatedAt: new Date(),
    exchangeRate: convertToMicroUnits(1),
    externalSource,
    toAccountId: 42,
    fromAccountId: null,
    amount: BigInt(0),
    tagIds: [],
    [TransactionAssociationEnum.ENTRIES]: [],
    ...input
});

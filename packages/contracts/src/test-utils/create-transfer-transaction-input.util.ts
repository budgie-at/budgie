import { convertToMicroUnits } from '../@generic/util/convert-to-micto-units.util';
import { ExternalSourceEnum } from '../account/enum/external-source.enum';
import { BuyAssetTransactionCreateEntityInterface } from '../transaction/entity/buy-asset-transaction-create-entity.interface';
import { TransactionAssociationEnum } from '../transaction/enum/transaction-association.enum';
import { TransactionTypeEnum } from '../transaction/enum/transaction-type.enum';

const [externalSource] = Object.values(ExternalSourceEnum);

export const createTransferTransactionInput = (
    input: Partial<BuyAssetTransactionCreateEntityInterface>
): BuyAssetTransactionCreateEntityInterface => ({
    amount: BigInt(0),
    type: TransactionTypeEnum.TRANSFER,
    title: 'Test',
    comment: '',
    externalId: null,
    operatedAt: new Date(),
    exchangeRate: convertToMicroUnits(2),
    externalSource,
    toAccountId: 2,
    fromAccountId: 1,
    tagIds: [],
    [TransactionAssociationEnum.ENTRIES]: [],
    ...input
});

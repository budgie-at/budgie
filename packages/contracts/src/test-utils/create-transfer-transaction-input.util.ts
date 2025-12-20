import { convertToMicroUnits } from '../@generic/util/convert-to-micro-units.util';
import { ExternalSourceEnum } from '../account/enum/external-source.enum';
import { BuyAssetTransactionCreateEntityInterface } from '../transaction/entity/buy-asset-transaction-create-entity.interface';
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
    ...input
});

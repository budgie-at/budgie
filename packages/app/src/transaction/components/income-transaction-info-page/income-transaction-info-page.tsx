import { TransactionTypeEnum } from '@budgie/contracts';

import { SimpleTransactionInfoPage } from '../simple-transaction-info-page/simple-transaction-info-page';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const IncomeTransactionInfoPage = ({ transaction }: UpdateTransactionFormPropsInterface) => (
    <SimpleTransactionInfoPage transaction={transaction} transactionType={TransactionTypeEnum.INCOME} />
);

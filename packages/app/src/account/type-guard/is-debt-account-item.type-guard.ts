import { AccountRowInterface } from '../interface/account-row.interface';
import { CryptoCurrencyGroupInterface } from '../interface/crypto-currency-group.interface';
import { DebtAccountItemInterface } from '../interface/debt-account-item.interface';

export const isDebtAccountItem = (
    item: AccountRowInterface | CryptoCurrencyGroupInterface | DebtAccountItemInterface
): item is DebtAccountItemInterface => 'debtAccount' in item;

import { AccountRowInterface } from '../interface/account-row.interface';
import { CryptoCurrencyGroupInterface } from '../interface/crypto-currency-group.interface';
import { DebtAccountGroupInterface } from '../interface/debt-account-group.interface';

export const isDebtAccountGroup = (
    item: AccountRowInterface | CryptoCurrencyGroupInterface | DebtAccountGroupInterface
): item is DebtAccountGroupInterface => 'debtAccounts' in item;

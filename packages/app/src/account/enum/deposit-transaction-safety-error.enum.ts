export enum DepositTransactionSafetyErrorEnum {
    ACCOUNT_NOT_FOUND = 'Account not found',
    DEPOSIT_EXPENSE = 'Deposit accounts cannot fund expenses',
    NEGATIVE_DEPOSIT_BALANCE = 'Deposit balance cannot become negative'
}

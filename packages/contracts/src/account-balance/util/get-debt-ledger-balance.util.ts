import { AccountDebtTypeEnum } from '../../account/enum/account-debt-type.enum';

export const getDebtLedgerBalance = (returnedAmount: number, debtType: AccountDebtTypeEnum, targetBalance: number): number => {
    if (debtType === AccountDebtTypeEnum.LENT) {
        return Math.abs(returnedAmount);
    }

    const remainingAmount = Math.max(targetBalance - Math.abs(returnedAmount), 0);

    return remainingAmount > 0 ? -remainingAmount : 0;
};

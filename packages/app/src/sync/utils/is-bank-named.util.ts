import type { EnableBankingBankInterface } from '@budgie/sync';

export const isBankNamed = (bank: Pick<EnableBankingBankInterface, 'name'>, name: string): boolean =>
    bank.name.toLocaleLowerCase() === name.toLocaleLowerCase();

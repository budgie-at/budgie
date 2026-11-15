import { router } from 'expo-router';

import type { EnableBankingBankInterface } from '@budgie/sync';

export const openEnableBankingBank = (bank: Pick<EnableBankingBankInterface, 'country' | 'name'>) => {
    router.push({ pathname: '/create-account/bank/[country]/[name]', params: { country: bank.country, name: bank.name } });
};

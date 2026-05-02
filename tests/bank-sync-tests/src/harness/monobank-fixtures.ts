import { MonobankAccountTypeEnum, MonobankCashbackTypeEnum } from '@budgie/bank-sync';

import type { MonobankAccountApiInterface, MonobankClientInfoApiInterface, MonobankTransactionApiInterface } from '@budgie/bank-sync';

const buildMonobankAccount = (
    overrides: Partial<MonobankAccountApiInterface> & Pick<MonobankAccountApiInterface, 'id'>
): MonobankAccountApiInterface => ({
    sendId: 'send-1',
    currencyCode: 980,
    cashbackType: MonobankCashbackTypeEnum.NONE,
    balance: 0,
    creditLimit: 0,
    maskedPan: ['*1234'],
    type: MonobankAccountTypeEnum.BLACK,
    iban: 'UA000000000000000000000000000',
    ...overrides
});

export const buildMonobankClientInfoWith = (accountIds: string[]): MonobankClientInfoApiInterface => ({
    clientId: 'c1',
    name: 'Test',
    webHookUrl: '',
    permissions: 'sp',
    accounts: accountIds.map(id => buildMonobankAccount({ id })),
    jars: []
});

type MonobankTxOverrides = Partial<MonobankTransactionApiInterface> & Pick<MonobankTransactionApiInterface, 'id' | 'amount' | 'hold'>;

export const buildMonobankTx = (overrides: MonobankTxOverrides): MonobankTransactionApiInterface => ({
    time: Math.floor(Date.now() / 1000),
    description: 'Test transaction',
    mcc: 5411,
    originalMcc: 5411,
    operationAmount: overrides.amount,
    currencyCode: 980,
    commissionRate: 0,
    cashbackAmount: 0,
    balance: 100000,
    ...overrides
});

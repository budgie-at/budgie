import { AccountType, CashbackType } from '@liaugust/monobank-sdk';

import type { Account, ClientInfo, Jar, StatementItem } from '@liaugust/monobank-sdk';

type MonobankAccountOverrides = Partial<Account> & Pick<Account, 'id'>;

type MonobankJarOverrides = Partial<Jar> & Pick<Jar, 'id'>;

type MonobankTxOverrides = Partial<StatementItem> & Pick<StatementItem, 'id' | 'amount' | 'hold'>;

export const buildMonobank = {
    account: (overrides: MonobankAccountOverrides): Account => ({
        sendId: 'send-1',
        currencyCode: 980,
        cashbackType: CashbackType.None,
        balance: 0,
        creditLimit: 0,
        maskedPan: ['*1234'],
        type: AccountType.Black,
        iban: 'UA000000000000000000000000000',
        ...overrides
    }),
    jar: (overrides: MonobankJarOverrides): Jar => ({
        sendId: 'jar-send-1',
        title: 'Test Jar',
        description: '',
        currencyCode: 980,
        balance: 0,
        goal: 0,
        ...overrides
    }),
    clientInfoWith: (accountIds: string[]): ClientInfo => ({
        clientId: 'c1',
        name: 'Test',
        webHookUrl: '',
        permissions: 'sp',
        accounts: accountIds.map(id => buildMonobank.account({ id })),
        jars: []
    }),
    transaction: (overrides: MonobankTxOverrides): StatementItem => ({
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
    })
};

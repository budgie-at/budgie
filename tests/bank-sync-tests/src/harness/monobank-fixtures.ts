interface MonobankAccountStub {
    readonly id: string;
    readonly sendId: string;
    readonly currencyCode: number;
    readonly cashbackType: string;
    readonly balance: number;
    readonly creditLimit: number;
    readonly maskedPan: string[];
    readonly type: string;
    readonly iban: string;
}

const buildMonobankAccount = (overrides: Partial<MonobankAccountStub> & Pick<MonobankAccountStub, 'id'>): MonobankAccountStub => ({
    sendId: 'send-1',
    currencyCode: 980,
    cashbackType: 'None',
    balance: 0,
    creditLimit: 0,
    maskedPan: ['*1234'],
    type: 'black',
    iban: 'UA000000000000000000000000000',
    ...overrides
});

export const buildMonobankClientInfoWith = (accountIds: string[]) => ({
    clientId: 'c1',
    name: 'Test',
    webHookUrl: '',
    permissions: 'sp',
    accounts: accountIds.map(id => buildMonobankAccount({ id })),
    jars: []
});

interface MonobankTxRequired {
    readonly id: string;
    readonly amount: number;
    readonly hold: boolean;
}

export const buildMonobankTx = (overrides: MonobankTxRequired & Record<string, unknown>): Record<string, unknown> => ({
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

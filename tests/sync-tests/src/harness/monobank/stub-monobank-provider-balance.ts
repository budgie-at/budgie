import { buildMonobank } from './build-monobank';
import { monobankStub } from './monobank-stub';

export const stubMonobankProviderBalance = (externalId: string, balance: number): void => {
    monobankStub.statement([]);
    monobankStub.clientInfo(
        buildMonobank.clientInfo({
            accounts: [buildMonobank.account({ id: externalId, balance })],
            jars: []
        })
    );
};

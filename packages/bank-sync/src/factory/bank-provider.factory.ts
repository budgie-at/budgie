import { BankProviderEnum } from '../core/enum/bank-provider.enum';
import { MonobankClient } from '../monobank/client/monobank.client';

import type { BankProviderFactoryInterface } from './bank-provider-factory.interface';
import type { BankProviderClientInterface } from '../core/interface/bank-provider-client.interface';

type ClientConstructor = new (token: string) => BankProviderClientInterface;

const providerRegistry: Map<BankProviderEnum, ClientConstructor> = new Map([
    [BankProviderEnum.MONOBANK, MonobankClient]
]);

class BankProviderFactory implements BankProviderFactoryInterface {
    createClient(provider: BankProviderEnum, token: string): BankProviderClientInterface {
        const ClientClass = providerRegistry.get(provider);

        if (!ClientClass) {
            throw new Error(`Unsupported bank provider: ${provider}`);
        }

        return new ClientClass(token);
    }

    isSupported(provider: BankProviderEnum): boolean {
        return providerRegistry.has(provider);
    }

    getSupportedProviders(): BankProviderEnum[] {
        return Array.from(providerRegistry.keys());
    }

    registerProvider(provider: BankProviderEnum, clientClass: ClientConstructor): void {
        providerRegistry.set(provider, clientClass);
    }
}

export const bankProviderFactory = new BankProviderFactory();


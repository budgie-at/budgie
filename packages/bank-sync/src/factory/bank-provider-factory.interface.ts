import type { BankProviderEnum } from '../core/enum/bank-provider.enum';
import type { BankProviderClientInterface } from '../core/interface/bank-provider-client.interface';

export interface BankProviderFactoryInterface {
    createClient(provider: BankProviderEnum, token: string): BankProviderClientInterface;
    isSupported(provider: BankProviderEnum): boolean;
    getSupportedProviders(): BankProviderEnum[];
}

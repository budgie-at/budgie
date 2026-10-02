import type { BankIntegrationCapabilitiesInterface } from './bank-integration-capabilities.interface';
import type { BankIntegrationEntityInterface } from '@budgie/contracts';

export interface BankIntegrationContextValueInterface {
    readonly integration: BankIntegrationEntityInterface;
    readonly capabilities: BankIntegrationCapabilitiesInterface;
}

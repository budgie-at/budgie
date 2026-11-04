import type { EnableBankingPendingAuthorizationInterface } from './enable-banking-pending-authorization.interface';

export interface EnableBankingStartAuthorizationInputInterface extends Pick<
    EnableBankingPendingAuthorizationInterface,
    'applicationId' | 'aspspName' | 'aspspCountry' | 'integrationId' | 'callbackUrl'
> {
    readonly redirectUrl: string;
    readonly maximumConsentValiditySeconds: number;
}

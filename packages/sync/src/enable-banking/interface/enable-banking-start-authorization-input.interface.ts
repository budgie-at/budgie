import type { EnableBankingPendingAuthorizationInterface } from '../constant/enable-banking-pending-authorization.schema';

export interface EnableBankingStartAuthorizationInputInterface extends Pick<
    EnableBankingPendingAuthorizationInterface,
    'applicationId' | 'aspspName' | 'aspspCountry' | 'integrationId' | 'connectAccountId' | 'callbackUrl'
> {
    readonly redirectUrl: string;
    readonly maximumConsentValiditySeconds: number;
}

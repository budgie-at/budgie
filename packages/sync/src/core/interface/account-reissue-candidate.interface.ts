import type { ExternalSourceEnum } from '@budgie/contracts';

export interface AccountReissueCandidateInterface {
    readonly provider: ExternalSourceEnum;
    readonly currencyCode: string;
    readonly predecessorTitle: string;
    readonly predecessorAccountId: number;
    readonly predecessorExternalId: string | null;
    readonly successorAccountId: number;
    readonly successorFirstAt: number;
    readonly successorLastAt: number;
    readonly externalId: string | null;
    readonly iban: string | null;
    readonly integrationId: number | null;
    readonly isActive: number;
}

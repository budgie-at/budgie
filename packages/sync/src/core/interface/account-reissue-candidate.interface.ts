export interface AccountReissueCandidateInterface {
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

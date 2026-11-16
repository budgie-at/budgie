import type { ExternalSourceEnum } from '@budgie/contracts';

export interface ArchivedAccountDuplicateCandidateInterface {
    readonly liveAccountId: number;
    readonly archivedAccountId: number;
    readonly externalSource: ExternalSourceEnum;
    readonly integrationId: number | null;
    readonly isActive: number;
}

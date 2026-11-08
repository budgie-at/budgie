import type { DestinationCommitCopyInterface } from '../../@generic/interface/destination-commit-copy.interface';

export interface CategoryDestinationParamsInterface {
    readonly title: string;
    readonly description?: string;
    readonly excludeCategoryIds: readonly number[];
    readonly syncZone?: string;
    readonly commitLabel: string;
    readonly getCommitCopy: (destinationTitle: string) => DestinationCommitCopyInterface;
}

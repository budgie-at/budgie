import type { DestinationCommitCopyInterface } from '../../@generic/interface/destination-commit-copy.interface';

export interface TagDestinationParamsInterface {
    readonly title: string;
    readonly description?: string;
    readonly excludeTagIds: readonly number[];
    readonly commitLabel: string;
    readonly getCommitCopy: (destinationTitle: string) => DestinationCommitCopyInterface;
}

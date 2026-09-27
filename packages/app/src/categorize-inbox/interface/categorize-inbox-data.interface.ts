import { CategorizeInboxRowInterface } from '@budgie/contracts';

import { CategorizeInboxBuildContextInterface } from './categorize-inbox-build-context.interface';

export interface CategorizeInboxDataInterface {
    readonly rows: CategorizeInboxRowInterface[];
    readonly context: CategorizeInboxBuildContextInterface;
    readonly isLoading: boolean;
}

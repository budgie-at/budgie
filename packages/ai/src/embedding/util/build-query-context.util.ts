import { buildTransactionContext } from './build-transaction-context.util';

interface BuildQueryContextParamsInterface {
    readonly title: string;
    readonly mccDescription: string | null;
    readonly comment: string;
}

export const buildQueryContext = (params: BuildQueryContextParamsInterface): string =>
    buildTransactionContext({
        title: params.title,
        mccDescription: params.mccDescription,
        comment: params.comment
    });

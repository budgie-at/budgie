import { INZHUR_CANONICAL_FUNDS } from '@budgie/sync';

import { useInzhurSetupQuery } from '../query/use-inzhur-setup.query';

export const useInzhurFundOptions = () => {
    const { setup } = useInzhurSetupQuery();
    const accountTitles = setup?.fundAccounts.map(account => account.title) ?? [];

    return [...new Set([...INZHUR_CANONICAL_FUNDS.map(fund => fund.name), ...accountTitles])];
};

import { ExternalSourceEnum } from '@budgie/contracts';

import { stripTransactionAccountTitlePrefix } from '../../transaction/utils/strip-transaction-account-title-prefix.util';

export const getInzhurShortTitle = (title: string): string => {
    const shortTitle = stripTransactionAccountTitlePrefix(title, ExternalSourceEnum.INZHUR) ?? title;

    return `${shortTitle.charAt(0).toLocaleUpperCase()}${shortTitle.slice(1)}`;
};

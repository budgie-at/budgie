import { ExternalSourceEnum } from '@budgie/contracts';

import { getInzhurShortTitle } from '../../inzhur/utils/get-inzhur-short-title.util';
import { stripTransactionAccountTitlePrefix } from '../../transaction/utils/strip-transaction-account-title-prefix.util';

export const getInstitutionAccountTitle = (title: string, provider: ExternalSourceEnum): string =>
    provider === ExternalSourceEnum.INZHUR ? getInzhurShortTitle(title) : (stripTransactionAccountTitlePrefix(title, provider) ?? title);

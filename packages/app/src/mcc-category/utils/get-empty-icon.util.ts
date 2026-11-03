import { UserIconNameEnum } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

export const getEmptyIcon = (search: string) => (isNotEmptyString(search) ? UserIconNameEnum.Search : UserIconNameEnum.CreditCard);

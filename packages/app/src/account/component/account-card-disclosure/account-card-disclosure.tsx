import { UserIconNameEnum } from '@budgie/contracts';
import { use } from 'react';

import { Icon } from '../../../@generic/component/icon/icon';
import { AccountRowDisclosureContext } from '../../context/account-row-disclosure.context';

export const AccountCardDisclosure = () =>
    use(AccountRowDisclosureContext) ? <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" /> : null;

import { UserIconNameEnum } from '@budgie/contracts';

import type { InzhurCanonicalFundInterface } from '../interface/inzhur-canonical-fund.interface';

export const INZHUR_CANONICAL_FUNDS: readonly InzhurCanonicalFundInterface[] = [
    { keyword: 'REIT', name: 'Inzhur REIT', icon: UserIconNameEnum.Building2 },
    { keyword: 'ЕНЕРДЖІ', name: 'Inzhur Energy', icon: UserIconNameEnum.Zap },
    { keyword: 'МІЛТЕХ', name: 'Inzhur MilTech', icon: UserIconNameEnum.Shield }
];

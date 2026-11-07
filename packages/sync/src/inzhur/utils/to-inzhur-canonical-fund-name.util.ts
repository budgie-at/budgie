import { INZHUR_CANONICAL_FUNDS } from '../constant/inzhur-canonical-funds.constant';

export const toInzhurCanonicalFundName = (name: string): string =>
    INZHUR_CANONICAL_FUNDS.find(fund => name.toUpperCase().includes(fund.keyword))?.name ?? name;

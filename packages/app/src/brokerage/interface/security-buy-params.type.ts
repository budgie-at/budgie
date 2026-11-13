import type { IdParamInterface } from '../../@generic/interface/id-param.interface';
import type { YahooListingInterface } from '@budgie/market';

export type SecurityBuyParamsType = IdParamInterface & Partial<Record<keyof YahooListingInterface, string>>;

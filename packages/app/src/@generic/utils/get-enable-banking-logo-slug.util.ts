import { ENABLE_BANKING_LOGO_NAMES } from '../constant/enable-banking-logo-names.constant';

const COMBINING_MARKS = /[̀-ͯ]/gu;
const NON_ALPHANUMERIC = /[^a-z0-9]+/gu;

const SLUG_BY_NORMALIZED_NAME = new Map(
    Object.entries(ENABLE_BANKING_LOGO_NAMES).flatMap(([slug, names]) => names.split(' ').map(name => [name, slug] as const))
);

const normalizeBankName = (name: string): string =>
    name.normalize('NFD').replaceAll(COMBINING_MARKS, '').toLowerCase().replaceAll(NON_ALPHANUMERIC, '');

export const getEnableBankingLogoSlug = (name: string): string | null => SLUG_BY_NORMALIZED_NAME.get(normalizeBankName(name)) ?? null;

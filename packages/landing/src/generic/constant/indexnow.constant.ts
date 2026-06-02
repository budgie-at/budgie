import { isNotEmptyString } from '@rnw-community/shared';

const FALLBACK_INDEXNOW_KEY = 'c642d43afb7beae8f76dbaf27cea5bab';

export const INDEXNOW_KEY = isNotEmptyString(process.env.INDEXNOW_KEY) ? process.env.INDEXNOW_KEY : FALLBACK_INDEXNOW_KEY;
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';
export const INDEXNOW_HOST = 'budgie.at';

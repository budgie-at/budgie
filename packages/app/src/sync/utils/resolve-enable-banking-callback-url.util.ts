import { ENABLE_BANKING_CALLBACK_PATH, ENABLE_BANKING_CALLBACK_URL } from '../constant/enable-banking-callback-url.constant';

export const resolveEnableBankingCallbackUrl = (path: string): string | null => {
    const queryStart = path.indexOf('?');
    const base = queryStart === -1 ? path : path.slice(0, queryStart);

    return base === ENABLE_BANKING_CALLBACK_URL || base === ENABLE_BANKING_CALLBACK_PATH
        ? `${ENABLE_BANKING_CALLBACK_URL}${path.slice(base.length)}`
        : null;
};

import { setI18n } from '@lingui/react/server';

import { getI18nInstance } from './app-router-i18n';

export type PageLangParam = {
    params: Promise<{ lang: string }>;
};

export const initLingui = (lang: string) => {
    const i18n = getI18nInstance(lang);

    setI18n(i18n);

    return i18n;
};

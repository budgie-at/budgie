'use client';

import { type Messages, setupI18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { ReactNode, useState } from 'react';

interface Props {
    children: ReactNode;
    initialLocale: string;
    initialMessages: Messages;
}

export const LinguiClientProvider = ({ children, initialLocale, initialMessages }: Props) => {
    const [i18n] = useState(() => setupI18n({ locale: initialLocale, messages: { [initialLocale]: initialMessages } }));

    return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
};

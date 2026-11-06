'use client';

import { setupI18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { messages as de } from '../../../i18n/locales/de/client-messages';
import { messages as en } from '../../../i18n/locales/en/client-messages';
import { messages as es } from '../../../i18n/locales/es/client-messages';
import { messages as fr } from '../../../i18n/locales/fr/client-messages';
import { messages as uk } from '../../../i18n/locales/uk/client-messages';
import { SUPPORTED_LOCALES } from '../../../i18n/supported-locales.constant.mjs';

const APP_CALLBACK_URL = 'budgie://enable-banking/callback';
const FORWARDED_PARAMETERS = ['code', 'state', 'error'];

const i18n = setupI18n({ locale: 'en', messages: { de, en, es, fr, uk } });

export const EnableBankingRelay = () => {
    const linkRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        const [language = 'en'] = navigator.language.split('-');
        i18n.activate(SUPPORTED_LOCALES.includes(language) ? language : 'en');

        const parameters = new URLSearchParams(window.location.search);
        const forwarded = FORWARDED_PARAMETERS.flatMap(name =>
            parameters.getAll(name).map(value => `${name}=${encodeURIComponent(value)}`)
        );
        window.history.replaceState(null, '', window.location.pathname);

        if (isNotEmptyArray(forwarded) && isDefined(linkRef.current)) {
            const appUrl = `${APP_CALLBACK_URL}?${forwarded.join('&')}`;
            linkRef.current.href = appUrl;
            linkRef.current.hidden = false;
            window.location.replace(appUrl);
        }
    }, []);

    return (
        <I18nProvider i18n={i18n}>
            <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-6 text-center text-foreground">
                <Image alt="" className="rounded-2xl" height={64} src="/logo/white-on-black.svg" width={64} />
                <p className="text-lg font-semibold">
                    <Trans>Continue in the Budgie app</Trans>
                </p>
                <a ref={linkRef} hidden className="min-h-11 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">
                    <Trans>Return to Budgie</Trans>
                </a>
            </main>
        </I18nProvider>
    );
};

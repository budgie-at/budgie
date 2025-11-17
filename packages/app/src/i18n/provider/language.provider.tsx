import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { ReactNode, useEffect } from 'react';

import { useSettingsContext } from '../../settings/context/settings.context';

interface Props {
    readonly children: ReactNode;
}

export const LanguageProvider = ({ children }: Props) => {
    const { settings } = useSettingsContext();

    useEffect(() => {
        i18n.activate(settings.language);
    }, [settings.language]);

    return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
};

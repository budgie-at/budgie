import { LanguageEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Atom from 'effect/reactivity/Atom';

import { settingsContextAtom } from '../../settings/constants/settings-context-atom.constant';
import { i18nActivateFallback, i18nEnsureLanguageActivated, i18nGetOSLocale } from '../utils/i18n.util';

const targetLanguageAtom = Atom.map(settingsContextAtom, ({ isLoading, settings }) => (isLoading ? i18nGetOSLocale() : settings.language));

export const activatedLanguageAtom = Atom.make(get => {
    const targetLanguage = get(targetLanguageAtom);

    return i18nEnsureLanguageActivated(targetLanguage).pipe(
        Effect.as(targetLanguage),
        Effect.catch(() =>
            Effect.sync(() => {
                i18nActivateFallback();

                return LanguageEnum.EN;
            })
        )
    );
});

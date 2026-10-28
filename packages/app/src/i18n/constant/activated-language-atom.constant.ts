import { LanguageEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { settingsAtom, settingsResultAtom } from '../../settings/constants/settings-atoms.constant';
import { i18nActivateFallback, i18nEnsureLanguageActivated, i18nGetOSLocale } from '../utils/i18n.util';

const targetLanguageAtom = Atom.make(get =>
    AsyncResult.isInitial(get(settingsResultAtom)) ? i18nGetOSLocale() : get(settingsAtom).language
);

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

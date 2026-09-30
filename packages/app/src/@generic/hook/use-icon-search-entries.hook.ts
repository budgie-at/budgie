import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { appAtomRuntime } from '../runtime/app.runtime';
import { iconSearchService } from '../service/icon-search.service';

const iconSearchEntriesAtom = appAtomRuntime.atom(iconSearchService.load().pipe(Effect.tapCause(Effect.logError)));

export const useIconSearchEntries = () => AsyncResult.getOrElse(useAtomValue(iconSearchEntriesAtom), () => iconSearchService.entries);

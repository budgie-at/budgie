import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { appAtomRuntime } from '../runtime/app.runtime';
import { iconSearchService } from '../service/icon-search.service';

import type { IconSearchEntryInterface } from '../interface/icon-search-entry.interface';

const EMPTY_ENTRIES: readonly IconSearchEntryInterface[] = [];

const iconSearchEntriesAtom = appAtomRuntime.atom(iconSearchService.load().pipe(Effect.tapCause(Effect.logError))).pipe(Atom.keepAlive);

export const useIconSearchEntries = () => AsyncResult.getOrElse(useAtomValue(iconSearchEntriesAtom), () => EMPTY_ENTRIES);

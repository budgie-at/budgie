import * as Effect from 'effect/Effect';
import * as Atom from 'effect/reactivity/Atom';
import * as Stream from 'effect/Stream';

import { appAtomRuntime } from '../runtime/app.runtime';
import { NetworkService } from '../service/network.service';

export const networkTypeAtom = appAtomRuntime
    .atom(Stream.unwrap(Effect.map(NetworkService, networkService => networkService.changes)))
    .pipe(Atom.keepAlive);

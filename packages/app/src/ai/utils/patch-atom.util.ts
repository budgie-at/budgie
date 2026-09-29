import { aiAtomRegistry } from '../constant/ai-atom-registry.constant';

import type * as Atom from 'effect/reactivity/Atom';

export const patchAtom = <T extends object>(atom: Atom.Writable<T>, patch: Partial<T>): void => {
    aiAtomRegistry.update(atom, value => ({ ...value, ...patch }));
};

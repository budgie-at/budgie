import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';

import type * as Atom from 'effect/reactivity/Atom';

export const patchAtom = <T extends object>(atom: Atom.Writable<T>, patch: Partial<T>): void => {
    appAtomRegistry.update(atom, value => ({ ...value, ...patch }));
};

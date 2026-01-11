import { useSyncExternalStore } from 'react';

const noop = (): (() => void) => noop;
const getSnapshot = (): boolean => true;
const getServerSnapshot = (): boolean => false;

export const useMounted = (): boolean => useSyncExternalStore(noop, getSnapshot, getServerSnapshot);

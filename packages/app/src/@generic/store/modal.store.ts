import { router } from 'expo-router';

import { emptyFn, isDefined } from '@rnw-community/shared';

import type { ModalEntries } from '../type/modal-entries.type';
import type { ModalOpener } from '../type/modal-opener.type';
import type { ModalOpeners } from '../type/modal-openers.type';
import type { ModalParams } from '../type/modal-params.type';
import type { ModalResult } from '../type/modal-result.type';
import type { ModalRoute } from '../type/modal-route.type';

export class ModalStore {
    private readonly entries: ModalEntries = {};
    private readonly listeners = new Map<ModalRoute, Set<() => void>>();
    private readonly openers: ModalOpeners = {};
    private nextEntryId = 0;

    opener<TRoute extends ModalRoute>(route: TRoute): ModalOpener<TRoute> {
        const openers: ModalOpeners<TRoute> = this.openers;
        const opener = openers[route] ?? ((params, onResult) => void this.open(route, params, onResult));

        openers[route] = opener;

        return opener;
    }

    open<TRoute extends ModalRoute>(route: TRoute, params?: ModalParams<TRoute>, onResult?: (result: ModalResult<TRoute> | null) => void) {
        const entries: ModalEntries<TRoute> = this.entries;
        const previousEntry = entries[route];

        entries[route] = null;
        previousEntry?.onResult(null);

        this.nextEntryId += 1;
        entries[route] = { id: this.nextEntryId, params: params ?? null, onResult: onResult ?? emptyFn };
        this.notify(route);
        router.push(route);
    }

    resolve<TRoute extends ModalRoute>(route: TRoute, result: ModalResult<TRoute> | null, skipBack = false, entryId?: number) {
        const currentEntryId = this.entries[route]?.id;

        if (isDefined(entryId) && currentEntryId !== entryId) {
            return;
        }

        if (!skipBack) {
            if (router.canDismiss()) {
                router.dismiss(1);
            } else if (router.canGoBack()) {
                router.back();
            }
        }

        this.settle(route, result, entryId);
    }

    dismiss(route: ModalRoute, entryId?: number) {
        this.settle(route, null, entryId);
    }

    getEntryId(route: ModalRoute): number | null {
        return this.entries[route]?.id ?? null;
    }

    getParams<TRoute extends ModalRoute>(route: TRoute): ModalParams<TRoute> | null {
        const entries: ModalEntries<TRoute> = this.entries;

        return entries[route]?.params ?? null;
    }

    subscribe(route: ModalRoute, listener: () => void) {
        const routeListeners = this.listeners.get(route) ?? new Set<() => void>();

        routeListeners.add(listener);
        this.listeners.set(route, routeListeners);

        return () => {
            routeListeners.delete(listener);
        };
    }

    private settle<TRoute extends ModalRoute>(route: TRoute, result: ModalResult<TRoute> | null, entryId?: number) {
        const entries: ModalEntries<TRoute> = this.entries;
        const entry = entries[route];
        const currentEntryId = entry?.id;

        if (!isDefined(currentEntryId) || (isDefined(entryId) && currentEntryId !== entryId)) {
            return;
        }

        entries[route] = null;
        this.notify(route);
        entry?.onResult(result);
    }

    private notify(route: ModalRoute) {
        this.listeners.get(route)?.forEach(listener => {
            listener();
        });
    }
}

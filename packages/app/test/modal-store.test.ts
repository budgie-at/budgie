import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { vi } from 'vitest';

import { ModalStore } from '../src/@generic/store/modal.store';

vi.mock('expo-router', () => ({ router: { push: vi.fn(), canDismiss: () => false, canGoBack: () => false, back: vi.fn() } }));

const openReopenedCategorySelector = () => {
    const modalStore = new ModalStore();
    const firstResult = vi.fn();
    const secondResult = vi.fn();

    modalStore.open('/category-selector', { title: 'First' }, firstResult);
    const firstEntryId = modalStore.getEntryId('/category-selector');

    modalStore.open('/category-selector', { title: 'Second' }, secondResult);
    const secondEntryId = modalStore.getEntryId('/category-selector');

    return { modalStore, firstResult, secondResult, firstEntryId, secondEntryId };
};

describe('ModalStore', () => {
    it.effect('hands out one opener per route', () =>
        Effect.sync(() => {
            const modalStore = new ModalStore();

            expect(modalStore.opener('/tag-form')).toBe(modalStore.opener('/tag-form'));
            expect(modalStore.opener('/category-form')).not.toBe(modalStore.opener('/tag-form'));
        })
    );

    it.effect('returns the same params snapshot until the route changes', () =>
        Effect.sync(() => {
            const modalStore = new ModalStore();

            expect(modalStore.getParams('/tag-form')).toBe(modalStore.getParams('/tag-form'));

            modalStore.opener('/tag-form')({ defaultTitle: 'Trip' });

            expect(modalStore.getParams('/tag-form')).toBe(modalStore.getParams('/tag-form'));
            expect(modalStore.getParams('/tag-form')).toEqual({ defaultTitle: 'Trip' });
        })
    );

    it.effect('settles the prior entry with null before storing a re-opened entry on the same route', () =>
        Effect.sync(() => {
            const modalStore = new ModalStore();
            const firstResults: (number | null)[] = [];
            let paramsDuringFirstCallback: ReturnType<ModalStore['getParams']> = { title: 'Unset' };

            modalStore.open('/category-selector', { title: 'First' }, result => {
                firstResults.push(result);
                paramsDuringFirstCallback = modalStore.getParams('/category-selector');
            });

            const firstEntryId = modalStore.getEntryId('/category-selector');

            modalStore.open('/category-selector', { title: 'Second' }, vi.fn());

            const secondEntryId = modalStore.getEntryId('/category-selector');

            expect(firstResults).toEqual([null]);
            expect(paramsDuringFirstCallback).toBeNull();
            expect(firstEntryId).not.toBeNull();
            expect(secondEntryId).not.toBeNull();
            expect(secondEntryId).not.toBe(firstEntryId);
            expect(modalStore.getParams('/category-selector')).toEqual({ title: 'Second' });
        })
    );

    it.effect('ignores dismiss from an older entry id after a newer entry was opened', () =>
        Effect.sync(() => {
            const { modalStore, firstResult, secondResult, firstEntryId, secondEntryId } = openReopenedCategorySelector();

            modalStore.dismiss('/category-selector', firstEntryId ?? void 0);

            expect(firstResult).toHaveBeenCalledTimes(1);
            expect(firstResult).toHaveBeenCalledWith(null);
            expect(secondResult).not.toHaveBeenCalled();
            expect(modalStore.getEntryId('/category-selector')).toBe(secondEntryId);
            expect(modalStore.getParams('/category-selector')).toEqual({ title: 'Second' });
        })
    );

    it.effect('resolves and clears the entry when called with the current entry id', () =>
        Effect.sync(() => {
            const { modalStore, secondResult, firstEntryId, secondEntryId } = openReopenedCategorySelector();

            modalStore.resolve('/category-selector', 99, true, firstEntryId ?? void 0);

            expect(secondResult).not.toHaveBeenCalled();
            expect(modalStore.getEntryId('/category-selector')).toBe(secondEntryId);

            modalStore.resolve('/category-selector', 42, true, secondEntryId ?? void 0);

            expect(secondResult).toHaveBeenCalledTimes(1);
            expect(secondResult).toHaveBeenCalledWith(42);
            expect(modalStore.getEntryId('/category-selector')).toBeNull();
            expect(modalStore.getParams('/category-selector')).toBeNull();

            modalStore.resolve('/category-selector', null, true, secondEntryId ?? void 0);

            expect(secondResult).toHaveBeenCalledTimes(1);
        })
    );
});

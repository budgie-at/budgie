import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { vi } from 'vitest';

import { ModalStore } from '../src/@generic/store/modal.store';

vi.mock('expo-router', () => ({ router: { push: vi.fn(), canDismiss: () => false, canGoBack: () => false, back: vi.fn() } }));

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
});

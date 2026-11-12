import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Contacts from 'expo-contacts/legacy';

import { NativeCallError } from '../error/native-call.error';
import { appAtomRuntime } from '../runtime/app.runtime';

import { useAppState } from './use-app-state.hook';

export type Contact = Contacts.ExistingContact;

const EMPTY_CONTACTS: Contact[] = [];

const loadContacts = Effect.gen(function* () {
    const currentPermission = yield* Effect.tryPromise({
        try: () => Contacts.getPermissionsAsync(),
        catch: cause => NativeCallError.make({ cause })
    });
    const permission =
        currentPermission.status === Contacts.PermissionStatus.UNDETERMINED
            ? yield* Effect.tryPromise({
                  try: () => Contacts.requestPermissionsAsync(),
                  catch: cause => NativeCallError.make({ cause })
              })
            : currentPermission;

    if (!permission.granted) {
        return { contacts: EMPTY_CONTACTS, permission };
    }

    const { data } = yield* Effect.tryPromise({
        try: () =>
            Contacts.getContactsAsync({
                fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.Image]
            }),
        catch: cause => NativeCallError.make({ cause })
    });

    return { contacts: data, permission };
}).pipe(Effect.tapError(Effect.logError));

const contactsAtom = appAtomRuntime.atom(loadContacts);

export const useContacts = () => {
    const result = useAtomValue(contactsAtom);
    const retry = useAtomRefresh(contactsAtom);
    const data = AsyncResult.getOrElse(result, () => null);

    useAppState(isActive => {
        if (isActive && !result.waiting) {
            retry();
        }
    });

    return {
        contacts: AsyncResult.isFailure(result) ? EMPTY_CONTACTS : (data?.contacts ?? EMPTY_CONTACTS),
        isInitial: AsyncResult.isInitial(result),
        isLoading: AsyncResult.isInitial(result) || result.waiting,
        isFailure: AsyncResult.isFailure(result),
        isDenied: data?.permission.granted === false,
        isLimited: data?.permission.accessPrivileges === 'limited',
        retry
    };
};

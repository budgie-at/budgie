import { useAtomValue } from '@effect/atom-react/Hooks';
import { t } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';
import * as Contacts from 'expo-contacts';
import Toast from 'react-native-toast-message';

import { isEmptyArray } from '@rnw-community/shared';

import { NativeCallError } from '../error/native-call.error';
import { appAtomRuntime } from '../runtime/app.runtime';

export type Contact = Contacts.ExistingContact;

const EMPTY_CONTACTS: Contact[] = [];

const showContactsError = (text1: string) =>
    Effect.sync(() => {
        Toast.show({ type: 'error', text1 });
    });

const contactsAtom = appAtomRuntime
    .atom(
        Effect.gen(function* () {
            const { status } = yield* Effect.tryPromise({
                try: () => Contacts.requestPermissionsAsync(),
                catch: cause => new NativeCallError({ cause })
            });

            if (status !== Contacts.PermissionStatus.GRANTED) {
                yield* showContactsError(t`Permission to access contacts was denied.`);

                return EMPTY_CONTACTS;
            }

            const { data } = yield* Effect.tryPromise({
                try: () =>
                    Contacts.getContactsAsync({
                        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.Image]
                    }),
                catch: cause => new NativeCallError({ cause })
            });

            if (isEmptyArray(data)) {
                yield* showContactsError(t`No contacts found on this device.`);
            }

            return data;
        }).pipe(
            Effect.tapError(() => showContactsError(t`Failed to load contacts.`)),
            Effect.orElseSucceed(() => EMPTY_CONTACTS)
        )
    )
    .pipe(Atom.keepAlive);

export const useContacts = () => AsyncResult.getOrElse(useAtomValue(contactsAtom), () => EMPTY_CONTACTS);

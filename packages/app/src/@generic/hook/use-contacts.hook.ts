import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Contacts from 'expo-contacts';
import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

import { isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { NativeCallError } from '../error/native-call.error';
import { appRuntime } from '../runtime/app.runtime';

export type Contact = Contacts.ExistingContact;

type ContactsState = {
    contacts: Contact[];
    loading: boolean;
    error: string | null;
    hasLoaded: boolean;
};

const initialState: ContactsState = {
    contacts: [],
    loading: false,
    error: null,
    hasLoaded: false
};

export const useContacts = () => {
    const [state, setState] = useState<ContactsState>(initialState);
    const { t } = useLingui();

    useEffect(() => {
        const fiber = appRuntime.runFork(
            Effect.gen(function* () {
                setState(prev => ({ ...prev, loading: true, error: null }));
                const { status } = yield* Effect.tryPromise({
                    try: () => Contacts.requestPermissionsAsync(),
                    catch: cause => new NativeCallError({ cause })
                });

                if (status !== Contacts.PermissionStatus.GRANTED) {
                    return { contacts: [], error: t`Permission to access contacts was denied.` };
                }

                const { data } = yield* Effect.tryPromise({
                    try: () =>
                        Contacts.getContactsAsync({
                            fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.Image]
                        }),
                    catch: cause => new NativeCallError({ cause })
                });

                return { contacts: data, error: isEmptyArray(data) ? t`No contacts found on this device.` : null };
            }).pipe(
                Effect.match({
                    onSuccess: result => void setState({ ...result, loading: false, hasLoaded: true }),
                    onFailure: () =>
                        void setState(prev => ({ ...prev, loading: false, hasLoaded: true, error: t`Failed to load contacts.` }))
                })
            )
        );

        return () => void fiber.interruptUnsafe();
    }, [t]);

    useEffect(() => {
        if (isNotEmptyString(state.error)) {
            Toast.show({
                type: 'error',
                text1: state.error
            });
        }
    }, [state.error]);

    return state;
};

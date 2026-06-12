import { useLingui } from '@lingui/react/macro';
import * as Contacts from 'expo-contacts';
import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

import { isNotEmptyString } from '@rnw-community/shared';

import { isE2eApp } from '../utils/is-e2e-app.util';

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
    const { t } = useLingui();
    const e2eContact: Contact = {
        id: 'maestro-e2e-contact',
        contactType: Contacts.ContactTypes.Person,
        name: t`Maestro E2E Contact`,
        firstName: t`Maestro E2E`,
        lastName: t`Contact`,
        phoneNumbers: [{ id: 'maestro-e2e-phone', label: 'mobile', number: '+15555550123' }],
        emails: [{ id: 'maestro-e2e-email', label: 'email', email: 'maestro-e2e@example.com' }]
    };
    const [state, setState] = useState<ContactsState>(() => {
        if (isE2eApp()) {
            return {
                ...initialState,
                contacts: [e2eContact],
                hasLoaded: true
            };
        }

        return initialState;
    });

    useEffect(() => {
        if (isE2eApp()) {
            return;
        }

        const loadContacts = async () => {
            setState(prev => ({ ...prev, loading: true, error: null }));

            try {
                const { status } = await Contacts.requestPermissionsAsync();

                if (status === Contacts.PermissionStatus.GRANTED) {
                    const { data } = await Contacts.getContactsAsync({
                        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.Image]
                    });

                    setState({
                        contacts: data,
                        loading: false,
                        error: null,
                        hasLoaded: true
                    });
                } else {
                    setState({
                        contacts: [],
                        loading: false,
                        error: t`Permission to access contacts was denied.`,
                        hasLoaded: true
                    });
                }
            } catch {
                setState({
                    contacts: [],
                    loading: false,
                    hasLoaded: true,
                    error: t`Failed to load contacts.`
                });
            }
        };

        void loadContacts();
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

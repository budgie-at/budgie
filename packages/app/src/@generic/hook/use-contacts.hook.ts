import { useLingui } from '@lingui/react/macro';
import * as Contacts from 'expo-contacts';
import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

import { isNotEmptyString } from '@rnw-community/shared';

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
    const [state, setState] = useState<ContactsState>(initialState);

    useEffect(() => {
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

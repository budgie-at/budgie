import { useLingui } from '@lingui/react/macro';
import React, { useRef } from 'react';
import { View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { ICONS } from '../../constant/icons.constant';
import { useContacts } from '../../hook/use-contacts.hook';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ContactSelectorBottomSheet } from '../contact-selector-bottom-sheet/contact-selector-bottom-sheet';
import { HorizontalCell } from '../horizontal-cell/horizontal-cell';
import { Icon } from '../icon/icon';

export default function ContactSelector() {
    const { contacts, error, loadContacts } = useContacts();
    const ref = useRef<BottomSheetInterface | null>(null);
    const { t } = useLingui();

    const handleOpen = async () => {
        await loadContacts();

        if (!isNotEmptyString(error)) {
            ref.current?.open();
        }
    };

    const handleSelect = console.log;
    const icon = isNotEmptyString(error) ? 'RotateCcw' : 'ChevronRight';

    return (
        <>
            <HorizontalCell
                right={
                    <View className="p-sm rounded-full">
                        <Icon icon={ICONS[icon]} className="text-primary" size={16} />
                    </View>
                }
                icon="User"
                onPress={handleOpen}
                variant="ghost"
                title={t`Select Contact`}
                description={t`Who owes you?`}
            />

            <ContactSelectorBottomSheet selectedContact={null} contacts={contacts} onSelect={handleSelect} ref={ref} />
        </>
    );
}

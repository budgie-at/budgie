import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { openContactsSettings } from '../../utils/open-contacts-settings.util';
import { Button } from '../button/button';
import { ContactSelectorSelector } from '../contact-selector/contact-selector.selector';
import { SearchInput } from '../search-input/search-input';
import { SheetTitleRow } from '../sheet-title-row/sheet-title-row';

interface Props {
    readonly search: string;
    readonly onSearchChange: (value: string) => void;
    readonly isLimited: boolean;
    readonly canSearch: boolean;
}

export const ContactSelectorHeader = ({ search, onSearchChange, isLimited, canSearch }: Props) => {
    const { t } = useLingui();
    const placeholder = canSearch ? t`Search contacts…` : t`Search unavailable`;
    const searchAccessibilityState = { disabled: !canSearch };

    return (
        <View>
            <View collapsable={false} className="px-3xl pb-md pt-7xl bg-surface">
                <View className="pb-[14px]">
                    <SheetTitleRow title={t`Contacts`} />
                </View>
                <View className="flex-row items-center">
                    <SearchInput
                        value={search}
                        onChangeText={onSearchChange}
                        editable={canSearch}
                        accessibilityLabel={t`Search contacts`}
                        accessibilityState={searchAccessibilityState}
                        placeholder={placeholder}
                        testID={ContactSelectorSelector.Search}
                        containerClassName="h-[40px] flex-1 rounded-3xl border-0 bg-surface-fill px-md"
                        inputClassName="ml-md h-[44px] text-[17px]"
                    />
                </View>
            </View>
            {isLimited ? (
                <View className="px-3xl pb-md">
                    <Button
                        content={t`Limited access · Manage in Settings`}
                        onPress={openContactsSettings}
                        variant="ghost"
                        className="min-h-[44px]"
                        testID={ContactSelectorSelector.Settings}
                    />
                </View>
            ) : null}
        </View>
    );
};

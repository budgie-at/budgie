import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { SearchInput } from '../../../@generic/component/search-input/search-input';
import { SheetTitleRow } from '../../../@generic/component/sheet-title-row/sheet-title-row';
import { AccountSelectorModalSelector } from '../../../app/account-selector-modal.selector';

interface Props {
    readonly search: string;
    readonly onSearchChange: (value: string) => void;
}

export const AccountSelectorHeader = ({ search, onSearchChange }: Props) => {
    const { t } = useLingui();

    return (
        <View collapsable={false} className="px-3xl pb-md pt-md bg-surface">
            <View className="pb-[14px]">
                <SheetTitleRow title={t`Account`} maxFontSizeMultiplier={2} closeButtonSize={44} />
            </View>
            <SearchInput
                containerClassName="h-auto min-h-[44px] rounded-3xl border-0 bg-surface-fill px-md"
                clearButtonClassName="h-[44px] w-[44px]"
                inputClassName="ml-md min-h-[44px] text-[17px]"
                maxFontSizeMultiplier={2}
                placeholder={t`Search accounts…`}
                value={search}
                onChangeText={onSearchChange}
                testID={AccountSelectorModalSelector.Input}
            />
        </View>
    );
};

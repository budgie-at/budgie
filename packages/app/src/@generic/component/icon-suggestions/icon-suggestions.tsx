import { UserIconNameEnum, UserIconType } from '@budgie/contracts';
import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { useIconSearchEntries } from '../../hook/use-icon-search-entries.hook';
import { iconSearchService } from '../../service/icon-search.service';
import { testID as testIDProps } from '../../utils/test-id.util';
import { IconSuggestionChip } from '../icon-suggestion-chip/icon-suggestion-chip';

interface Props {
    readonly terms: readonly string[];
    readonly limit: number;
    readonly excludedIcons?: readonly UserIconNameEnum[];
    readonly onSelect: (icon: UserIconType) => void;
    readonly testID?: string;
    readonly children?: ReactNode;
}

export const IconSuggestions = ({ terms, limit, excludedIcons, onSelect, testID, children }: Props) => {
    const entries = useIconSearchEntries();

    const suggestions = iconSearchService.suggest(entries, terms, excludedIcons).slice(0, limit);

    if (isEmptyArray(suggestions)) {
        return null;
    }

    return (
        <View className="gap-y-sm" testID={testID}>
            {children}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-x-md">
                {suggestions.map(({ icon, label }) => (
                    <IconSuggestionChip key={icon} icon={icon} label={label} onSelect={onSelect} {...testIDProps(testID, icon)} />
                ))}
            </ScrollView>
        </View>
    );
};

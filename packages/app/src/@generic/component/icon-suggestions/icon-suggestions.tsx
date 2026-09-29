import { UserIconType } from '@budgie/contracts';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { useIconSearchEntries } from '../../hook/use-icon-search-entries.hook';
import { iconSearchService } from '../../service/icon-search.service';
import { testID as testIDProps } from '../../utils/test-id.util';
import { IconSuggestionChip } from '../icon-suggestion-chip/icon-suggestion-chip';

interface Props {
    readonly terms: readonly string[];
    readonly limit: number;
    readonly onSelect: (icon: UserIconType) => void;
    readonly testID?: string;
    readonly children?: ReactNode;
}

export const IconSuggestions = ({ terms, limit, onSelect, testID, children }: Props) => {
    const entries = useIconSearchEntries();

    const suggestions = iconSearchService.rank(entries, terms).slice(0, limit);

    if (isEmptyArray(suggestions)) {
        return null;
    }

    return (
        <View className="gap-y-md" testID={testID}>
            {children}

            <View className="flex-row flex-wrap justify-center gap-md">
                {suggestions.map(({ icon }) => (
                    <IconSuggestionChip key={icon} icon={icon} onSelect={onSelect} {...testIDProps(testID, icon)} />
                ))}
            </View>
        </View>
    );
};

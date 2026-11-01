import { UserIconNameEnum, UserIconType } from '@budgie/contracts';
import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { useIconSearchEntries } from '../../hook/use-icon-search-entries.hook';
import { iconSearchService } from '../../service/icon-search.service';
import { cn } from '../../utils/cn.util';
import { testID as testIDProps } from '../../utils/test-id.util';
import { IconSuggestionChip } from '../icon-suggestion-chip/icon-suggestion-chip';

interface Props {
    readonly terms: readonly string[];
    readonly limit: number;
    readonly excludedIcons?: readonly UserIconNameEnum[];
    readonly selectedIcon?: UserIconType;
    readonly edgeFadeClassName?: string;
    readonly onSelect: (icon: UserIconType) => void;
    readonly testID?: string;
    readonly children?: ReactNode;
}

export const IconSuggestions = (props: Props) => {
    const { terms, limit, excludedIcons, selectedIcon, edgeFadeClassName, onSelect, testID, children } = props;
    const entries = useIconSearchEntries();

    const suggestions = iconSearchService.suggest(entries, terms, excludedIcons).slice(0, limit);
    const hasEdgeFade = isDefined(edgeFadeClassName);
    const contentContainerClassName = cn('gap-x-md', hasEdgeFade && 'pr-[32px]');

    if (isEmptyArray(suggestions)) {
        return null;
    }

    return (
        <View className="gap-y-sm" testID={testID}>
            {children}

            <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName={contentContainerClassName}>
                    {suggestions.map(({ icon, label }) => (
                        <IconSuggestionChip
                            key={icon}
                            icon={icon}
                            label={label}
                            isSelected={icon === selectedIcon}
                            onSelect={onSelect}
                            {...testIDProps(testID, icon)}
                        />
                    ))}
                </ScrollView>
                {hasEdgeFade ? (
                    <View pointerEvents="none" className={cn('absolute inset-y-0 right-0 w-[32px] bg-linear-to-r', edgeFadeClassName)} />
                ) : null}
            </View>
        </View>
    );
};

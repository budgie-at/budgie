import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { EmptyFn, isNotEmptyString } from '@rnw-community/shared';

import { toExcerpt } from '../../utils/to-excerpt.util';
import { Button } from '../button/button';

interface Props {
    readonly search: string;
    readonly createLabel: string;
    readonly onCreate: EmptyFn;
    readonly onClearSearch: EmptyFn;
}

const SEARCH_EXCERPT_LENGTH = 24;

export const SearchablePageEmptyStateActions = ({ search, createLabel, onCreate, onClearSearch }: Props) => {
    const { t } = useLingui();
    const hasSearch = isNotEmptyString(search);
    const getCreateLabel = (query: string) => t`Create “${query}”`;
    const visibleCreateLabel = hasSearch ? getCreateLabel(toExcerpt(search, SEARCH_EXCERPT_LENGTH)) : createLabel;
    const accessibleCreateLabel = hasSearch ? getCreateLabel(search) : createLabel;

    return (
        <View className="max-w-full items-center gap-y-xs">
            <Button
                variant="cta"
                size="sm"
                leftIcon={UserIconNameEnum.Plus}
                content={visibleCreateLabel}
                accessibilityLabel={accessibleCreateLabel}
                onPress={onCreate}
                className="max-w-full rounded-full px-5xl"
            />
            {hasSearch ? (
                <Button variant="ghost" size="sm" content={t`Clear search`} onPress={onClearSearch} className="border-0 bg-transparent" />
            ) : null}
        </View>
    );
};

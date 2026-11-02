import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { SELECTOR_TITLED_HEADER_OFFSET } from '../../constant/selector-header-offset.constant';
import { SelectorNoResultsState } from '../selector-no-results-state/selector-no-results-state';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string | undefined;
    readonly description: string | undefined;
    readonly query: string;
    readonly resultCount: number | null;
    readonly noResultsHint: string;
    readonly onCreate: () => void;
    readonly children: (topOffset: number) => ReactNode;
}

const HEADER_SPACER_STYLE = { height: SELECTOR_TITLED_HEADER_OFFSET };
const LIST_TOP_OFFSET = 4;

export const SelectorModalDescription = (props: Props) => {
    const { title, description, query, resultCount, noResultsHint, onCreate, children } = props;
    const renderBody = (topOffset: number) =>
        isNotEmptyString(query) && resultCount === 0 ? (
            <SelectorNoResultsState query={query} hint={noResultsHint} topOffset={topOffset} onCreate={onCreate} />
        ) : (
            children(topOffset)
        );

    if (!isNotEmptyString(title) && !isNotEmptyString(description)) {
        return renderBody(SELECTOR_TITLED_HEADER_OFFSET);
    }

    return (
        <View className="flex-1">
            <View style={HEADER_SPACER_STYLE} />
            <View className="gap-y-xs px-3xl pb-lg">
                {isNotEmptyString(title) ? (
                    <Text className="text-primary text-[17px] font-semibold leading-[22px]" accessibilityRole="header">
                        {title}
                    </Text>
                ) : null}
                {isNotEmptyString(description) ? (
                    <Text className="text-secondary-foreground text-[15px] leading-[20px]">{description}</Text>
                ) : null}
            </View>
            <View className="flex-1">{renderBody(LIST_TOP_OFFSET)}</View>
        </View>
    );
};

import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { SelectorCreatePill } from '../selector-create-pill/selector-create-pill';
import { SelectorSearchEmptyState } from '../selector-search-empty-state/selector-search-empty-state';

interface Props {
    readonly query: string;
    readonly hint: string;
    readonly topOffset: number;
    readonly onCreate: () => void;
}

export const SelectorNoResultsState = ({ query, hint, topOffset, onCreate }: Props) => {
    const { t } = useLingui();
    const containerStyle = { paddingTop: topOffset };

    return (
        <View className="pt-7xl" style={containerStyle}>
            <SelectorSearchEmptyState query={query} hint={hint}>
                <SelectorCreatePill label={t`Create “${query}”`} onPress={onCreate} />
            </SelectorSearchEmptyState>
        </View>
    );
};

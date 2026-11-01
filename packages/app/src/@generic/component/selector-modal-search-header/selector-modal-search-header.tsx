import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { SelectorCreateButton } from '../selector-create-button/selector-create-button';
import { SelectorSearchRow } from '../selector-search-row/selector-search-row';

interface Props {
    readonly search: string;
    readonly onSearchChange: (value: string) => void;
    readonly placeholder?: string;
    readonly createLabel?: string;
    readonly onCreate?: () => void;
    readonly createTestID?: string;
    readonly testID?: string;
}

export const SelectorModalSearchHeader = (props: Props) => {
    const { search, onSearchChange, placeholder, createLabel, onCreate, createTestID, testID } = props;
    const { t } = useLingui();

    const resolvedPlaceholder = placeholder ?? t`Search…`;

    return (
        <View collapsable={false} className="absolute top-0 left-0 right-0 z-10 pt-4xl pb-lg px-xl bg-primary-reverse">
            <SelectorSearchRow search={search} onSearchChange={onSearchChange} placeholder={resolvedPlaceholder} testID={testID}>
                {isNotEmptyString(createLabel) && isDefined(onCreate) ? (
                    <SelectorCreateButton label={createLabel} onPress={onCreate} testID={createTestID} />
                ) : null}
            </SelectorSearchRow>
        </View>
    );
};

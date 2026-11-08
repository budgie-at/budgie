import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useAnchoredMorphPanelClose } from '../../context/anchored-morph-panel.context';
import { SelectorSearchRow } from '../selector-search-row/selector-search-row';
import { SheetTitleRow } from '../sheet-title-row/sheet-title-row';

import type { ReactNode } from 'react';

interface Props {
    readonly search: string;
    readonly onSearchChange: (value: string) => void;
    readonly title: string;
    readonly placeholder?: string;
    readonly trailing?: ReactNode;
    readonly testID?: string;
    readonly onBack?: () => void;
}

export const SelectorModalSearchHeader = (props: Props) => {
    const { search, onSearchChange, title, placeholder, trailing, testID, onBack } = props;
    const { t } = useLingui();
    const closePanel = useAnchoredMorphPanelClose();

    const resolvedPlaceholder = placeholder ?? t`Search…`;
    const isBackMode = isDefined(onBack);
    const closeIcon = isBackMode ? UserIconNameEnum.ChevronLeft : UserIconNameEnum.X;
    const closeLabel = isBackMode ? t`Back` : t`Close`;
    const resolvedTrailing = isBackMode ? (trailing ?? <View />) : trailing;

    return (
        <View collapsable={false} className="px-3xl pb-md pt-md bg-surface">
            <View className="pb-[10px]">
                <SheetTitleRow
                    title={title}
                    trailing={resolvedTrailing}
                    onClose={onBack ?? closePanel ?? void 0}
                    closeIcon={closeIcon}
                    closeLabel={closeLabel}
                />
            </View>
            <SelectorSearchRow
                search={search}
                onSearchChange={onSearchChange}
                placeholder={resolvedPlaceholder}
                testID={testID}
                autoFocus={isDefined(closePanel)}
            />
        </View>
    );
};

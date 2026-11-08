import { View } from 'react-native';

import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../constant/morphing-sheet-height-ratio.constant';
import { useMorphingSheetCommit } from '../../hook/use-morphing-sheet-commit.hook';
import { useMorphingSheetListHeight } from '../../hook/use-morphing-sheet-list-height.hook';
import { IconPickerPanel } from '../icon-picker-panel/icon-picker-panel';

import type { UserIconNameEnum, UserIconType } from '@budgie/contracts';

interface Props {
    readonly selectedIcon?: UserIconType;
    readonly keywords?: string[];
    readonly excludedIcons?: readonly UserIconNameEnum[];
    readonly onCommit: (icon: UserIconType) => void;
}

export const IconSelectorModalContent = ({ selectedIcon, keywords, excludedIcons, onCommit }: Props) => {
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const commit = useMorphingSheetCommit(onCommit);

    return (
        <View style={listStyle}>
            <IconPickerPanel
                selectedIcon={selectedIcon}
                keywords={keywords}
                excludedIcons={excludedIcons}
                onSelect={commit}
                className="pt-lg"
            />
        </View>
    );
};

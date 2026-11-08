import { UserIconType } from '@budgie/contracts';
import { View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { useAnchoredMorphOriginPress } from '../../../@generic/hook/use-anchored-morph-origin-press.hook';
import { SettingsRow } from '../settings-row/settings-row';

import type { RoundedEdgeEnum } from '../../../@generic/enum/rounded-edge.enum';
import type { AnchoredMorphOriginInterface } from '../../../@generic/interface/anchored-morph-origin.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly edge: RoundedEdgeEnum;
    readonly icon: UserIconType;
    readonly title: string;
    readonly subtitle?: string;
    readonly right: ReactNode;
    readonly testID: string;
    readonly onPress: (origin: AnchoredMorphOriginInterface) => void;
}

export const AnchoredSettingsRow = ({ edge, icon, title, subtitle, right, testID, onPress }: Props) => {
    const rowProps = { icon, title, subtitle, right, testID, variant: 'ghost' } as const;
    const { ref, handlePress } = useAnchoredMorphOriginPress(edge, <SettingsRow {...rowProps} onPress={emptyFn} />, onPress);

    return (
        <View ref={ref} collapsable={false}>
            <SettingsRow {...rowProps} onPress={handlePress} />
        </View>
    );
};

import { UserIconType } from '@budgie/contracts';

import { AnchoredMorphTrigger } from '../../../@generic/component/anchored-morph-trigger/anchored-morph-trigger';
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

    return (
        <AnchoredMorphTrigger edge={edge} onPress={onPress}>
            {handlePress => <SettingsRow {...rowProps} onPress={handlePress} />}
        </AnchoredMorphTrigger>
    );
};

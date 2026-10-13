import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import HelpCircle from 'reicon-react-native/icons/HelpCircle';
import { withUniwind } from 'uniwind';

import { styledIconAtom } from '../../constant/styled-icon-atom.constant';
import { IconSelector } from '../icon/icon.selector';

import type { IconProps } from 'reicon-react-native';
import type { ApplyUniwind } from 'uniwind';

interface Props extends ApplyUniwind<IconProps> {
    readonly icon: UserIconNameEnum;
}

const STYLED_FALLBACK_ICON = withUniwind(HelpCircle);

export const ReiconIcon = ({ icon, ...rest }: Props) => {
    const styledIcon = useAtomValue(styledIconAtom(icon));

    if (!AsyncResult.isSuccess(styledIcon)) {
        return <STYLED_FALLBACK_ICON {...rest} testID={IconSelector.Fallback} />;
    }

    const StyledIcon = styledIcon.value;

    return <StyledIcon {...rest} />;
};

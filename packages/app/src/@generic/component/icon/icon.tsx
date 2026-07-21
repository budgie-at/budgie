import { UserIconNameEnum } from '@budgie/contracts';
import { CircleQuestionMark } from 'lucide-react-native';
import { styled } from 'nativewind';

import { ICONS } from '../../constant/icons.constant';

import type { LucideIcon, LucideProps } from 'lucide-react-native';

interface IconProps extends LucideProps {
    readonly icon: UserIconNameEnum;
}

const createStyledIcon = (baseIcon: LucideIcon) => styled(baseIcon, { className: { target: 'style' } });
const STYLED_ICONS: Partial<Record<UserIconNameEnum, ReturnType<typeof createStyledIcon>>> = Object.fromEntries(
    Object.entries(ICONS).map(([icon, baseIcon]) => [icon, createStyledIcon(baseIcon)])
);
const STYLED_FALLBACK_ICON = createStyledIcon(CircleQuestionMark);

export const Icon = ({ icon, ...rest }: IconProps) => {
    const IconToRender = STYLED_ICONS[icon] ?? STYLED_FALLBACK_ICON;

    // oxlint-disable-next-line react-hooks-js/static-components
    return <IconToRender {...rest} />;
};

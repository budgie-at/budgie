import { UserIconNameEnum } from '@budgie/contracts';
import { CircleQuestionMark } from 'lucide-react-native';
import { styled } from 'nativewind';

import { ICONS } from '../../constant/icons.constant';

import type { LucideIcon, LucideProps } from 'lucide-react-native';

interface IconProps extends LucideProps {
    readonly icon: UserIconNameEnum;
}

const StyledFallbackIcon: LucideIcon = styled(CircleQuestionMark, { className: { target: 'style' } });
const STYLED_ICONS: Partial<Record<UserIconNameEnum, LucideIcon>> = Object.fromEntries(
    Object.entries(ICONS).map(([icon, IconComponent]) => [icon, styled(IconComponent, { className: { target: 'style' } })])
);

export const Icon = ({ icon, ...rest }: IconProps) => {
    const IconToRender = STYLED_ICONS[icon] ?? StyledFallbackIcon;

    return <IconToRender {...rest} />;
};

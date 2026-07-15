import { UserIconNameEnum } from '@budgie/contracts';
import { CircleQuestionMark } from 'lucide-react-native';
import { styled } from 'nativewind';

import { ICONS } from '../../constant/icons.constant';

import type { LucideIcon, LucideProps } from 'lucide-react-native';

interface IconProps extends LucideProps {
    readonly icon: UserIconNameEnum;
}

export const Icon = ({ icon, ...rest }: IconProps) => {
    const IconComponent: LucideIcon = ICONS[icon] ?? CircleQuestionMark;
    const IconToRender = styled(IconComponent, { className: { target: 'style' } });

    // oxlint-disable-next-line react-hooks-js/static-components
    return <IconToRender {...rest} />;
};

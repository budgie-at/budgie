import { styled } from 'nativewind';

import { ICONS, IconName } from '../../constant/icons.constant';

import type { LucideProps } from 'lucide-react-native';

interface IconProps extends LucideProps {
    readonly icon: IconName;
}

export const Icon = ({ icon, ...rest }: IconProps) => {
    const IconToRender = styled(ICONS[icon], { className: { target: 'style' } });

    // TODO: We need to improve here
    // eslint-disable-next-line react-hooks/static-components
    return <IconToRender {...rest} />;
};

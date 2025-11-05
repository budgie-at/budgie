import { styled } from 'nativewind';

import type { LucideIcon, LucideProps } from 'lucide-react-native';

interface IconProps extends LucideProps {
    readonly icon: LucideIcon;
}

export const Icon = ({ icon, ...rest }: IconProps) => {
    const IconToRender = styled(icon, { className: { target: 'style' } });

    // TODO: We need to improve here
    // eslint-disable-next-line react-hooks/static-components
    return <IconToRender {...rest} />;
};

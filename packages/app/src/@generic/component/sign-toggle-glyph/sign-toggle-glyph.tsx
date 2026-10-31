import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { cn } from '../../utils/cn.util';
import { Icon } from '../icon/icon';

interface Props {
    readonly className: string;
}

export const SignToggleGlyph = ({ className }: Props) => (
    <View className="items-center">
        <Icon icon={UserIconNameEnum.ChevronUp} size={11} className={className} />
        <Icon icon={UserIconNameEnum.ChevronDown} size={11} className={cn('-mt-[5px]', className)} />
    </View>
);

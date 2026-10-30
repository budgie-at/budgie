import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { CategorizeInboxSelectionEnum } from '../../enum/categorize-inbox-selection.enum';

interface Props {
    readonly selection: CategorizeInboxSelectionEnum;
}

export const CategorizeInboxSelectionIndicator = ({ selection }: Props) => {
    const isIncluded = selection === CategorizeInboxSelectionEnum.INCLUDED;
    const isPartial = selection === CategorizeInboxSelectionEnum.PARTIAL;

    const circleClassName = isIncluded
        ? 'h-[20px] w-[20px] items-center justify-center rounded-full bg-primary'
        : 'h-[20px] w-[20px] items-center justify-center rounded-full border-[1.5px] border-secondary-foreground';

    return (
        <View className={circleClassName}>
            {isIncluded ? <Icon icon={UserIconNameEnum.Check} size={12} className="text-primary-reverse" /> : null}
            {isPartial ? <Icon icon={UserIconNameEnum.Minus} size={12} className="text-secondary-foreground" /> : null}
        </View>
    );
};

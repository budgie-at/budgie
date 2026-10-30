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

    const circleClassName =
        isIncluded || isPartial
            ? 'h-[22px] w-[22px] items-center justify-center rounded-full bg-positive-fill'
            : 'h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] border-secondary-foreground/50';

    return (
        <View className={circleClassName}>
            {isIncluded ? <Icon icon={UserIconNameEnum.Check} size={14} className="text-white" /> : null}
            {isPartial ? <Icon icon={UserIconNameEnum.Minus} size={14} className="text-white" /> : null}
        </View>
    );
};

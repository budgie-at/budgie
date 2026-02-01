import { UserIconNameEnum } from '@budgie/contracts';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useGetMccCategoryByIdQuery } from '../../../mcc-category/query/use-get-mcc-category-by-id.query';

interface Props {
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
}

export const MccInfoRow = ({ transactionTitle, mccCategoryId }: Props) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { mccCategory } = useGetMccCategoryByIdQuery(mccCategoryId);

    const hasTitle = isNotEmptyString(transactionTitle);
    const hasMcc = isDefined(mccCategory);

    if (!hasTitle && !hasMcc) {
        return null;
    }

    const handlePress = () => {
        if (hasMcc) {
            setIsExpanded(previous => !previous);
        }
    };

    const chevronIcon = isExpanded ? UserIconNameEnum.ChevronUp : UserIconNameEnum.ChevronDown;

    return (
        <Pressable className="items-center py-sm" onPress={handlePress}>
            {hasTitle ? <Text className="text-sm text-secondary-foreground font-medium">{transactionTitle}</Text> : null}

            {hasMcc ? (
                <View className="flex-row items-center gap-xxs mt-xxs">
                    <View className="rounded-sm py-xxs px-sm bg-secondary-background/50 border border-secondary-corner">
                        <Text className="text-secondary-foreground text-xxs font-medium">{mccCategory.shortDescription}</Text>
                    </View>
                    <Icon className="text-tertiary-foreground" icon={chevronIcon} size={12} />
                </View>
            ) : null}

            {isExpanded && hasMcc ? <Text className="text-xxs text-tertiary-foreground mt-xs">{mccCategory.fullDescription}</Text> : null}
        </Pressable>
    );
};

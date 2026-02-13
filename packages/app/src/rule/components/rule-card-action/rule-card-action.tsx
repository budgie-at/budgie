import { RuleActionTypeEnum, RuleActionWithRelationsEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

interface Props {
    readonly action: RuleActionWithRelationsEntityInterface;
}

const getActionContent = ({ type, category, tag }: RuleActionWithRelationsEntityInterface): ReactNode | null => {
    if (type === RuleActionTypeEnum.SET_CATEGORY && isDefined(category)) {
        const categoryTitle = category.title;

        return (
            <Trans>
                set category to <Text className="font-semibold text-primary">{categoryTitle}</Text>
            </Trans>
        );
    }

    if (type === RuleActionTypeEnum.ADD_TAG && isDefined(tag)) {
        const tagTitle = tag.title;

        return (
            <Trans>
                add tag <Text className="font-semibold text-primary">{tagTitle}</Text>
            </Trans>
        );
    }

    return null;
};

export const RuleCardAction = ({ action }: Props) => {
    const content = getActionContent(action);

    if (!isDefined(content)) {
        return null;
    }

    return (
        <View className="flex-row items-center gap-x-sm">
            <Text className="text-xs text-secondary-foreground">|</Text>
            <Text className="text-xs text-secondary-foreground">{content}</Text>
        </View>
    );
};

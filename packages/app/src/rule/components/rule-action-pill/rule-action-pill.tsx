import { RuleActionTypeEnum, RuleActionWithRelationsEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly action: RuleActionWithRelationsEntityInterface;
}

const ICON_SIZE = 12;

export const RuleActionPill = ({ action }: Props) => {
    const { type, category, tag } = action;

    /* jscpd:ignore-start */
    if (type === RuleActionTypeEnum.SET_CATEGORY && isDefined(category)) {
        const categoryTitle = category.title;

        return (
            <View className="flex-row items-center gap-x-sm rounded-2xl border border-secondary-corner bg-ghost-background px-lg py-md">
                <Icon icon={UserIconNameEnum.FolderOpen} size={ICON_SIZE} className="text-primary" />
                <Text className="text-xs text-primary">
                    <Trans>Category → {categoryTitle}</Trans>
                </Text>
            </View>
        );
    }
    /* jscpd:ignore-end */

    if (type === RuleActionTypeEnum.ADD_TAG && isDefined(tag)) {
        const tagTitle = tag.title;

        return (
            <View className="flex-row items-center gap-x-sm rounded-2xl border border-secondary-corner bg-ghost-background px-lg py-md">
                <Icon icon={UserIconNameEnum.Tag} size={ICON_SIZE} className="text-primary" />
                <Text className="text-xs text-primary">
                    <Trans>Tag → {tagTitle}</Trans>
                </Text>
            </View>
        );
    }

    if (type === RuleActionTypeEnum.CONVERT_TO_TRANSFER) {
        return (
            <View className="flex-row items-center gap-x-sm rounded-2xl border border-secondary-corner bg-ghost-background px-lg py-md">
                <Icon icon={UserIconNameEnum.ArrowRightLeft} size={ICON_SIZE} className="text-primary" />
                <Text className="text-xs text-primary">
                    <Trans>Transfer</Trans>
                </Text>
            </View>
        );
    }

    return null;
};

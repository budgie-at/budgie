import { CategoryEntityInterface, TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Fragment, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';

const ACTION_ICON_SIZE = 12;

interface ActionPillItem {
    readonly key: string;
    readonly icon: UserIconNameEnum;
    readonly label: ReactNode;
}

interface Props {
    readonly category: Pick<CategoryEntityInterface, 'title'> | null;
    readonly tags: Pick<TagEntityInterface, 'title'>[] | null;
}

export const SuggestRuleActionPills = ({ category, tags }: Props) => {
    const hasTags = isNotEmptyArray(tags);

    if (!isDefined(category) && !hasTags) {
        return null;
    }

    const items: ActionPillItem[] = [];

    if (isDefined(category)) {
        const categoryTitle = category.title;
        items.push({ key: 'category', icon: UserIconNameEnum.FolderOpen, label: <Trans>Category → {categoryTitle}</Trans> });
    }

    if (hasTags) {
        for (const tag of tags) {
            const tagTitle = tag.title;
            items.push({ key: `tag-${tagTitle}`, icon: UserIconNameEnum.Tag, label: <Trans>Tag → {tagTitle}</Trans> });
        }
    }

    return (
        <View className="flex-row flex-wrap items-center gap-sm">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const showComma = !isLast && items.length > 2;
                const showAnd = !isLast && index === items.length - 2;

                return (
                    <Fragment key={item.key}>
                        <View className="flex-row items-center gap-x-sm rounded-2xl border border-primary/15 bg-ghost-background px-lg py-md">
                            <Icon icon={item.icon} size={ACTION_ICON_SIZE} className="text-primary" />
                            <Text className="text-xs text-primary">{item.label}</Text>
                        </View>
                        {showComma ? <Text className="text-xs text-secondary-foreground">,</Text> : null}
                        {showAnd ? (
                            <Text className="text-xs text-secondary-foreground">
                                <Trans>and</Trans>
                            </Text>
                        ) : null}
                    </Fragment>
                );
            })}
        </View>
    );
};

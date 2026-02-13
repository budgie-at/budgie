import { CategoryEntityInterface, TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly category: Pick<CategoryEntityInterface, 'title'> | null;
    readonly tags: Pick<TagEntityInterface, 'title'>[] | null;
}

export const SuggestRuleActionPills = ({ category, tags }: Props) => {
    const hasTags = isNotEmptyArray(tags);

    if (!isDefined(category) && !hasTags) {
        return null;
    }

    const categoryTitle = category?.title;

    return (
        <View className="flex-row flex-wrap gap-md">
            {isDefined(category) ? (
                <View className="flex-row items-center gap-x-sm rounded-2xl border border-primary/15 bg-ghost-background px-lg py-md">
                    <Icon icon={UserIconNameEnum.FolderOpen} size={12} className="text-primary" />
                    <Text className="text-xs text-primary">
                        <Trans>Category → {categoryTitle}</Trans>
                    </Text>
                </View>
            ) : null}
            {hasTags
                ? tags.map(tag => {
                      const tagTitle = tag.title;

                      return (
                          <View
                              key={tagTitle}
                              className="flex-row items-center gap-x-sm rounded-2xl border border-primary/15 bg-ghost-background px-lg py-md"
                          >
                              <Icon icon={UserIconNameEnum.Tag} size={12} className="text-primary" />
                              <Text className="text-xs text-primary">
                                  <Trans>Tag → {tagTitle}</Trans>
                              </Text>
                          </View>
                      );
                  })
                : null}
        </View>
    );
};

import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { HapticPressable } from '../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../@generic/components/icon/icon';
import { Page } from '../../@generic/components/page/page';
import { ICONS } from '../../@generic/constant/icons.constant';
import { TagsList } from '../../tag/components/tags-list/tags-list';
import { CreateTag } from '../../tag/components/create-tag/create-tag';
import { CustomTagsEmptyState } from '../../tag/components/custom-tags-empty-state/custom-tags-empty-state';
import { useGetTagsLiveQuery } from '../../tag/query/use-get-tags.live-query';

export default function Tags() {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const { tags } = useGetTagsLiveQuery(search);

    const goBack = () => void router.back();

    return (
        <Page
            header={
                <View className="pb-7xl px-5xl border-b border-b-secondary-corner">
                    <View className="flex-row items-center justify-between mb-7xl">
                        <Text className="text-6xl text-primary">
                            <Trans>Tags</Trans>
                        </Text>

                        <HapticPressable onPress={goBack}>
                            <Icon icon={ICONS.X} />
                        </HapticPressable>
                    </View>

                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder={t`Search tags...`}
                        className="text-primary placeholder:text-secondary-foreground h-[44px] px-xl bg-secondary-background rounded-5xl border border-secondary-corner"
                    />
                </View>
            }
        >
            {isNotEmptyArray(tags) ? <TagsList tags={tags} /> : <CustomTagsEmptyState search={search} />}

            <CreateTag />
        </Page>
    );
}

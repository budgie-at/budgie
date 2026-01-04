import { RuleEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { router } from 'expo-router';
import { ComponentProps, useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { AnimatedFlatList } from '../../../@generic/component/animated-flat-list/animated-flat-list';
import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { SearchablePageEmptyState } from '../../../@generic/component/searchagle-page-empty-state/searchagle-page-empty-state';
import { ruleRepository } from '../../../@generic/drizzle/db/db';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { IdInterface } from '../../../@generic/interface/id.interface';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { RuleCard } from '../../../rule/components/rule-card/rule-card';
import { useSearchRulesQuery } from '../../../rule/query/use-search-rules.query';

type RuleWithRelationsType = ComponentProps<typeof RuleCard>['rule'];

const keyExtractor = (item: IdInterface) => item.id.toString();
const safeEdges = ['bottom'] as const;
const listFooter = <SafeAreaView edges={safeEdges} />;
const handleGoBack = () => void goBackOrReplace('/settings');

export default function RulesPage() {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const { rules } = useSearchRulesQuery(search);
    const [notify] = useVibration();

    const handleDeleteRule = async (id: number) => {
        await ruleRepository.deleteById(id);
        notify(NotificationFeedbackType.Success);
    };

    const handleOpenRule = (rule: RuleEntityInterface) => {
        void router.push(`/rules/${rule.id}/edit`);
    };

    const handleCreateRule = () => {
        void router.push('/rules/create');
    };

    const renderItem = (rule: RuleWithRelationsType, index: number) => {
        const order = index + 1;

        return (
            <DeletableRow id={rule.id} onDelete={handleDeleteRule}>
                <RuleCard onOpen={handleOpenRule} order={order} rule={rule} />
            </DeletableRow>
        );
    };

    const emptyStateIcon = isNotEmptyString(search) ? UserIconNameEnum.Search : UserIconNameEnum.Zap;
    const emptyStateTitle = isNotEmptyString(search) ? t`No Results` : t`No Rules Yet`;
    const emptyStateDescription = isNotEmptyString(search)
        ? t`No rules match your search`
        : t`Create rules to automatically categorize and tag your bank transactions`;

    return (
        <Page
            header={
                <PageHeader
                    onGoBack={handleGoBack}
                    title={t`Rules`}
                    bottom={
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder={t`Search rules...`}
                            className="text-primary placeholder:text-secondary-foreground h-11 px-xl bg-secondary-background rounded-5xl border border-secondary-corner"
                        />
                    }
                />
            }
        >
            {isNotEmptyArray(rules) ? (
                <AnimatedFlatList
                    className="flex-1"
                    data={rules}
                    contentContainerClassName="gap-y-5xl pt-5xl"
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    ListFooterComponent={listFooter}
                />
            ) : (
                <SearchablePageEmptyState title={emptyStateTitle} icon={emptyStateIcon} description={emptyStateDescription} />
            )}

            <View className="absolute bottom-1/10 right-10">
                <Animated.View entering={ZoomIn.duration(300).delay(350)}>
                    <HapticPressable
                        onPress={handleCreateRule}
                        className="bg-primary rounded-full w-16 h-16 items-center justify-center active:scale-[0.95]"
                    >
                        <Icon icon={UserIconNameEnum.Plus} className="text-primary-reverse" size={32} />
                    </HapticPressable>
                </Animated.View>
            </View>
        </Page>
    );
}

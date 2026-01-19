import { BudgetTemplateEntityInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { budgetTemplateRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetLoadTemplateBottomSheet } from '../../../budget/components/budget-load-template-bottom-sheet/budget-load-template-bottom-sheet';
import { BudgetTemplateRow } from '../../../budget/components/budget-template-row/budget-template-row';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { useGetBudgetTemplatesQuery } from '../../../budget/query/use-get-budget-templates.query';

const keyExtractor = (item: BudgetTemplateEntityInterface) => String(item.id);

export default function BudgetTemplatesScreen() {
    const { t } = useLingui();

    const loadTemplateRef = useRef<BottomSheetInterface | null>(null);

    const [selectedTemplate, setSelectedTemplate] = useState<BudgetTemplateEntityInterface | null>(null);

    const { budget } = useGetActiveBudgetQuery();
    const { templates, isLoading, refetch } = useGetBudgetTemplatesQuery();

    const handleGoBack = () => void goBackOrReplace('/budget/settings');

    const handlePressTemplate = (template: BudgetTemplateEntityInterface) => {
        setSelectedTemplate(template);
        void loadTemplateRef.current?.open();
    };

    const handleDeleteTemplate = async (templateId: number) => {
        try {
            await budgetTemplateRepository.deleteById(templateId);
            refetch();
        } catch {
            Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to delete template` });
        }
    };

    const handleApplySuccess = () => {
        refetch();
    };

    const renderItem = ({ item }: { item: BudgetTemplateEntityInterface }) => {
        const handlePress = () => void handlePressTemplate(item);
        const handleDelete = () => handleDeleteTemplate(item.id);

        return <BudgetTemplateRow template={item} onPress={handlePress} onDelete={handleDelete} />;
    };

    const renderEmpty = () => (
        <View className="flex-1 items-center justify-center py-20 px-7xl">
            <Text className="text-secondary-foreground text-center">
                <Trans>No templates saved yet. Save your current budget as a template to reuse it later.</Trans>
            </Text>
        </View>
    );

    /* jscpd:ignore-start */
    if (isLoading) {
        return (
            <Page header={<PageHeader title={t`Budget Templates`} onGoBack={handleGoBack} />}>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-secondary-foreground">
                        <Trans>Loading...</Trans>
                    </Text>
                </View>
            </Page>
        );
    }

    return (
        <>
            <Page header={<PageHeader title={t`Budget Templates`} onGoBack={handleGoBack} />}>
                <FlatList
                    data={templates}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    ListEmptyComponent={renderEmpty}
                    contentContainerClassName="py-4 gap-y-3"
                    showsVerticalScrollIndicator={false}
                />
            </Page>

            {isDefined(budget) ? (
                <BudgetLoadTemplateBottomSheet
                    ref={loadTemplateRef}
                    template={selectedTemplate}
                    budget={budget}
                    onSuccess={handleApplySuccess}
                />
            ) : null}
        </>
    );
    /* jscpd:ignore-end */
}

import { BudgetEntityInterface, BudgetTemplateEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { RefObject, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetFormFooter } from '../../../@generic/component/bottom-sheet-form-footer/bottom-sheet-form-footer';
import { BottomSheetHeader } from '../../../@generic/component/bottom-sheet-header/bottom-sheet-header';
import { BottomSheetScrollView } from '../../../@generic/component/bottom-sheet-scroll-view/bottom-sheet-scroll-view';
import { Icon } from '../../../@generic/component/icon/icon';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { budgetTemplateService } from '../../service/budget-template.service';
import { budgetService } from '../../service/budget.service';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly template: BudgetTemplateEntityInterface | null;
    readonly budget: BudgetEntityInterface | undefined;
    readonly onSuccess?: () => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements
export const BudgetLoadTemplateBottomSheet = (props: Props) => {
    const { ref, template, budget, onSuccess } = props;

    const { t } = useLingui();

    const [missingCategoryIds, setMissingCategoryIds] = useState<number[]>([]);
    const [showMissingWarning, setShowMissingWarning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isDefined(template)) {
            setMissingCategoryIds([]);
            setShowMissingWarning(false);

            return;
        }

        void budgetTemplateService.validateTemplate(template).then(result => {
            setMissingCategoryIds(result.missingCategoryIds);

            return null;
        });
    }, [template]);

    const handleDismiss = () => {
        setShowMissingWarning(false);
    };

    const handleCancel = () => {
        handleDismiss();
        void ref.current?.close();
    };

    const handleApply = async (skipMissingCategories: boolean) => {
        if (!isDefined(template) || !isDefined(budget)) {
            return;
        }

        setIsSubmitting(true);

        try {
            const validatedTemplate = await budgetTemplateService.validateTemplate(template);
            const formData = budgetTemplateService.applyTemplateToFormData(validatedTemplate, skipMissingCategories);

            await budgetService.update(budget.id, {
                name: budget.name,
                startDate: budget.startDate,
                endDate: budget.endDate,
                ...formData
            });

            void ref.current?.close();
            handleDismiss();
            onSuccess?.();
        } catch {
            Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to apply template` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInitialApply = () => {
        if (isNotEmptyArray(missingCategoryIds)) {
            setShowMissingWarning(true);

            return;
        }

        void handleApply(false);
    };

    const handleApplyAnyway = () => {
        void handleApply(true);
    };

    const hasMissingCategories = isNotEmptyArray(missingCategoryIds);
    const missingCount = missingCategoryIds.length;
    const isApplyDisabled = !isDefined(template) || isSubmitting;

    if (showMissingWarning) {
        return (
            <BottomSheet enableDynamicSizing onDismiss={handleDismiss} ref={ref}>
                <BottomSheetScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <View className="px-7xl py-5xl">
                        <View className="items-center mb-5xl">
                            <View className="bg-warning-background p-xl rounded-full mb-lg">
                                <Icon icon={UserIconNameEnum.TriangleAlert} size={32} className="text-warning-foreground" />
                            </View>
                            <BottomSheetHeader size="lg" align="center" title={t`Missing Categories`} />
                        </View>

                        <Text className="text-secondary-foreground text-center">
                            <Trans>{missingCount} categories from this template no longer exist in your app.</Trans>
                        </Text>

                        <Text className="text-secondary-foreground text-center mt-md">
                            <Trans>Applying this template will skip the missing categories and only apply the ones that still exist.</Trans>
                        </Text>
                    </View>

                    <BottomSheetFormFooter
                        onCancel={handleCancel}
                        onSubmit={handleApplyAnyway}
                        submitLabel={t`Apply Anyway`}
                        submitDisabled={isSubmitting}
                    />
                </BottomSheetScrollView>
            </BottomSheet>
        );
    }

    return (
        <BottomSheet enableDynamicSizing onDismiss={handleDismiss} ref={ref}>
            <BottomSheetScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View className="px-7xl py-5xl">
                    <View className="mb-5xl">
                        <BottomSheetHeader size="lg" align="center" title={t`Load Template`} />
                    </View>

                    {isDefined(template) ? (
                        <View className="items-center">
                            <View className="bg-primary-background p-xl rounded-full mb-lg">
                                <Icon icon={UserIconNameEnum.FileText} size={32} className="text-primary" />
                            </View>

                            <Text className="text-primary font-semibold text-lg text-center mb-sm">{template.name}</Text>

                            {hasMissingCategories ? (
                                <View className="flex-row items-center mt-md bg-warning-background/20 px-lg py-sm rounded-lg">
                                    <Icon icon={UserIconNameEnum.TriangleAlert} size={16} className="text-warning-foreground mr-sm" />
                                    <Text className="text-warning-foreground text-sm">
                                        <Trans>{missingCount} categories no longer exist</Trans>
                                    </Text>
                                </View>
                            ) : null}

                            <Text className="text-secondary-foreground text-center mt-lg">
                                <Trans>This will replace your current budget settings with the template configuration.</Trans>
                            </Text>
                        </View>
                    ) : null}
                </View>

                <BottomSheetFormFooter
                    onCancel={handleCancel}
                    onSubmit={handleInitialApply}
                    submitLabel={t`Apply Template`}
                    submitDisabled={isApplyDisabled}
                />
            </BottomSheetScrollView>
        </BottomSheet>
    );
};

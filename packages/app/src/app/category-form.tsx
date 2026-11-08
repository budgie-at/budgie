import { View } from 'react-native';

import { useAccessibilityLayer } from '../@generic/hook/use-accessibility-layer.hook';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { CategoryForm } from '../category/components/category-form/category-form';
import { useCategoryFormModal, useCategoryFormModalParams } from '../category/context/category-form-modal.context';

export default function CategoryFormModal() {
    const [, resolveCategoryForm, dismissCategoryForm] = useCategoryFormModal();
    useModalDismiss(dismissCategoryForm);
    const currentParams = useCategoryFormModalParams();
    const isCovered = useAccessibilityLayer();

    const handleCancel = () => {
        resolveCategoryForm(null);
    };

    return (
        <View className="flex-1" accessibilityElementsHidden={isCovered}>
            <CategoryForm
                category={currentParams?.category}
                defaultTitle={currentParams?.defaultTitle}
                syncZone={currentParams?.syncZone}
                onSuccess={resolveCategoryForm}
                onCancel={handleCancel}
            />
        </View>
    );
}

import { View } from 'react-native';

import { useAccessibilityLayer } from '../@generic/hook/use-accessibility-layer.hook';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { CategoryForm } from '../category/components/category-form/category-form';

export default function CategoryFormModal() {
    const { params: currentParams, resolve: resolveCategoryForm } = useModalRoute('/category-form');
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

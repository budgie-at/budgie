import { View } from 'react-native';

import { useAccessibilityLayer } from '../@generic/hook/use-accessibility-layer.hook';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { TagForm } from '../tag/components/tag-form/tag-form';

export default function TagFormModal() {
    const { params: currentParams, resolve: resolveTagForm } = useModalRoute('/tag-form');
    const isCovered = useAccessibilityLayer();

    const handleCancel = () => {
        resolveTagForm(null);
    };

    return (
        <View className="flex-1" accessibilityElementsHidden={isCovered}>
            <TagForm
                tag={currentParams?.tag}
                defaultTitle={currentParams?.defaultTitle}
                onSuccess={resolveTagForm}
                onCancel={handleCancel}
            />
        </View>
    );
}

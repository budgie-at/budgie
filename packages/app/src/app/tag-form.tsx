import { View } from 'react-native';

import { useAccessibilityLayer } from '../@generic/hook/use-accessibility-layer.hook';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { TagForm } from '../tag/components/tag-form/tag-form';
import { useTagFormModal, useTagFormModalParams } from '../tag/context/tag-form-modal.context';

export default function TagFormModal() {
    const [, resolveTagForm, dismissTagForm] = useTagFormModal();
    useModalDismiss(dismissTagForm);
    const currentParams = useTagFormModalParams();
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

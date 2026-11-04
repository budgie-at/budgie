import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { TagForm } from '../tag/components/tag-form/tag-form';
import { useTagFormModal, useTagFormModalParams } from '../tag/context/tag-form-modal.context';

export default function TagFormModal() {
    const [, resolveTagForm, dismissTagForm] = useTagFormModal();
    useModalDismiss(dismissTagForm);
    const currentParams = useTagFormModalParams();

    const handleCancel = () => {
        resolveTagForm(null);
    };

    return (
        <TagForm tag={currentParams?.tag} defaultTitle={currentParams?.defaultTitle} onSuccess={resolveTagForm} onCancel={handleCancel} />
    );
}

import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { TagForm, TagFormResult } from '../tag/components/tag-form/tag-form';
import { useTagFormModal, useTagFormModalParams } from '../tag/context/tag-form-modal.context';

export default function TagFormModal() {
    const [, resolveTagForm, dismissTagForm] = useTagFormModal();
    useModalDismiss(dismissTagForm);
    const currentParams = useTagFormModalParams();

    const handleSuccess = (result: TagFormResult) => {
        resolveTagForm(result);
    };

    const handleCancel = () => {
        resolveTagForm(null);
    };

    return (
        <TagForm tag={currentParams?.tag} defaultTitle={currentParams?.defaultTitle} onSuccess={handleSuccess} onCancel={handleCancel} />
    );
}

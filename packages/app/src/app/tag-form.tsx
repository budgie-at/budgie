import { TagForm, TagFormResult } from '../tag/components/tag-form/tag-form';
import { useTagFormModal } from '../tag/context/tag-form-modal.context';

export default function TagFormModal() {
    const [, resolveTagForm, currentParams] = useTagFormModal();

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

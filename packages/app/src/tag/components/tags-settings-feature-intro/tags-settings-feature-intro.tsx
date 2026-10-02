import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { FeatureIntro } from '../../../@generic/component/feature-intro/feature-intro';
import { useTagFormModal } from '../../context/tag-form-modal.context';

export const TagsSettingsFeatureIntro = () => {
    const { t } = useLingui();
    const [openTagForm] = useTagFormModal();

    const handleCreate = () => void openTagForm();

    return (
        <FeatureIntro
            icon={UserIconNameEnum.Tag}
            title={t`Organise spending your own way`}
            description={t`Tags cut across categories — track a trip, a project or a person and see the true total.`}
            buttonText={t`Create a tag`}
            onCreate={handleCreate}
        />
    );
};

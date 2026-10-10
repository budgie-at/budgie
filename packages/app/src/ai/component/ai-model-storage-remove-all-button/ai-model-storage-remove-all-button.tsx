import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { Button } from '../../../@generic/component/button/button';
import { AiModelStorageCardSelector } from '../ai-model-storage-card/ai-model-storage-card.selector';

interface Props {
    readonly disabled: boolean;
    readonly isLoading: boolean;
    readonly onPress: () => void;
}

export const AiModelStorageRemoveAllButton = ({ disabled, isLoading, onPress }: Props) => {
    const { t } = useLingui();

    return (
        <Button
            content={t`Remove All`}
            leftIcon={UserIconNameEnum.Trash2}
            variant="destructive"
            disabled={disabled}
            isLoading={isLoading}
            onPress={onPress}
            testID={AiModelStorageCardSelector.RemoveAllButton}
        />
    );
};

import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { AiModelStorageActionStatusEnum } from '../../enum/ai-model-storage-action-status.enum';
import { AiModelStorageIdEnum } from '../../enum/ai-model-storage-id.enum';
import { formatModelStorageSize } from '../../utils/format-model-storage-size.util';
import { AiModelStorageCardSelector } from '../ai-model-storage-card/ai-model-storage-card.selector';

import type { AiModelStorageEntryInterface } from '../../interface/ai-model-storage-entry.interface';

interface Props {
    readonly entry: AiModelStorageEntryInterface;
    readonly actionStatus: AiModelStorageActionStatusEnum;
    readonly onRemove: (id: AiModelStorageIdEnum) => void;
}

export const AiModelStorageRow = ({ entry, actionStatus, onRemove }: Props) => {
    const { t } = useLingui();
    const labelsById: Record<AiModelStorageIdEnum, { readonly title: string; readonly purpose: string }> = {
        [AiModelStorageIdEnum.CHAT]: { title: t`Qwen3 1.7B Q4_K_M`, purpose: t`Local chat model` },
        [AiModelStorageIdEnum.EMBEDDING]: { title: t`EmbeddingGemma 300M Q8_0`, purpose: t`Local embedding model` },
        [AiModelStorageIdEnum.STT]: { title: t`Whisper large-v3 turbo Q8_0`, purpose: t`Local speech-to-text model` },
        [AiModelStorageIdEnum.LEGACY_EMBEDDING]: {
            title: t`Legacy Nomic embedding file`,
            purpose: t`No longer used by this version`
        },
        [AiModelStorageIdEnum.LEGACY_CHAT]: { title: t`Legacy Qwen chat file`, purpose: t`No longer used by this version` },
        [AiModelStorageIdEnum.LEGACY_STT]: { title: t`Legacy Whisper file`, purpose: t`No longer used by this version` },
        [AiModelStorageIdEnum.PARTIAL_STT]: { title: t`Partial Whisper download`, purpose: t`No longer used by this version` }
    };
    const { title, purpose } = labelsById[entry.id];
    const displayPurpose = entry.id === AiModelStorageIdEnum.LEGACY_STT && entry.isCurrent ? t`Local speech-to-text model` : purpose;
    const status = entry.isBusy ? t`Finishing download` : t`Downloaded`;
    const displayStatus = entry.isCurrent || entry.isBusy ? status : t`Cleanup available`;
    const iconVariant = entry.isCurrent ? 'positive' : 'dark-warning';
    const isRemoving = actionStatus === AiModelStorageActionStatusEnum.REMOVING;
    const isRemoveDisabled = entry.isBusy || actionStatus !== AiModelStorageActionStatusEnum.IDLE;
    const handleRemove = () => void onRemove(entry.id);

    return (
        <View
            className="flex-row items-center gap-x-2xl rounded-4xl border border-secondary-corner bg-secondary-background p-3xl"
            {...testIDProps(AiModelStorageCardSelector.Row(entry.id))}
        >
            <CircleIcon icon={UserIconNameEnum.HardDrive} variant={iconVariant} border={false} size={36} iconSize={18} />

            <View className="flex-1 gap-y-xs">
                <Text className="text-primary text-sm font-semibold">{title}</Text>
                <Text className="text-secondary-foreground text-xs">{displayPurpose}</Text>
                <Text className="text-secondary-foreground text-xs">
                    {formatModelStorageSize(entry.bytes)} · {displayStatus}
                </Text>
            </View>

            {isRemoving ? (
                <ActivityIndicator size="small" />
            ) : (
                <Button
                    size="sm"
                    variant="destructive"
                    content={t`Remove`}
                    leftIcon={UserIconNameEnum.Trash2}
                    disabled={isRemoveDisabled}
                    onPress={handleRemove}
                    testID={AiModelStorageCardSelector.RemoveButton(entry.id)}
                />
            )}
        </View>
    );
};

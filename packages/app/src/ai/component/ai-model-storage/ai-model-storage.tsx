import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomRefresh } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { useEffectAction } from '../../../@generic/hook/use-effect-action.hook';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { aiModelStorageAtom } from '../../constant/ai-model-storage-atom.constant';
import { AiModelStorageService } from '../../service/ai-model-storage.service';

const BYTES_PER_GB = 1_000_000_000;

export const AiModelStorage = () => {
    const { t } = useLingui();
    const { totalBytes, unusedBytes } = AsyncResult.getOrElse(useLiveAtomValue(aiModelStorageAtom), () => ({
        totalBytes: 0,
        unusedBytes: 0
    }));
    const refresh = useAtomRefresh(aiModelStorageAtom);
    const [runDelete, isDeleting] = useEffectAction(t`Could not remove unused downloads`);
    const totalSize = `${(totalBytes / BYTES_PER_GB).toFixed(1)} GB`;
    const unusedSize = `${(unusedBytes / BYTES_PER_GB).toFixed(1)} GB`;

    const handleDelete = () =>
        void runDelete(
            Effect.flatMap(AiModelStorageService, aiModelStorageService => aiModelStorageService.deleteUnused()),
            refresh
        );

    return (
        <View className="gap-y-lg">
            <Text className="text-secondary-foreground text-sm">{t`AI downloads on this device: ${totalSize}`}</Text>

            {isPositiveNumber(unusedBytes) ? (
                <Button
                    content={t`Remove unused downloads (${unusedSize})`}
                    leftIcon={UserIconNameEnum.Trash2}
                    variant="destructive"
                    isLoading={isDeleting}
                    onPress={handleDelete}
                />
            ) : null}
        </View>
    );
};

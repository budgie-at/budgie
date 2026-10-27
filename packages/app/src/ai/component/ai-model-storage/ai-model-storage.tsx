import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomRefresh } from '@effect/atom-react/Hooks';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { aiModelStorageAtom } from '../../constant/ai-model-storage-atom.constant';
import { AiModelStorageService } from '../../service/ai-model-storage.service';

export const AiModelStorage = () => {
    const { t } = useLingui();
    const usage = useLiveAtomValue(aiModelStorageAtom);
    const refresh = useAtomRefresh(aiModelStorageAtom);
    const { isLoading: isDeleting, run: runDelete } = useSingleFlight();
    const formatSize = (bytes: number): string => {
        const unit = Math.min(3, Math.floor(Math.log10(Math.max(1, bytes)) / 3));

        return `${(bytes / 1000 ** unit).toFixed(unit === 0 ? 0 : 1)} ${[t`bytes`, 'KB', 'MB', 'GB'][unit]}`;
    };
    const handleDelete = () =>
        void runDelete(
            Effect.flatMap(AiModelStorageService, aiModelStorageService => aiModelStorageService.deleteUnused()).pipe(
                Effect.ensuring(Effect.sync(refresh)),
                toastOnFailure(t`Could not remove unused downloads`)
            )
        );

    if (AsyncResult.isInitial(usage)) {
        return (
            <Text className="text-secondary-foreground text-sm">
                <Trans>Loading AI downloads…</Trans>
            </Text>
        );
    }
    if (AsyncResult.isFailure(usage)) {
        return (
            <View className="gap-y-lg">
                <Text className="text-secondary-foreground text-sm">
                    <Trans>Could not load AI downloads</Trans>
                </Text>
                <Button content={t`Retry`} onPress={refresh} />
            </View>
        );
    }
    const totalSize = formatSize(usage.value.totalBytes);
    const unusedSize = formatSize(usage.value.unusedBytes);

    return (
        <View className="gap-y-lg">
            <Text className="text-secondary-foreground text-sm">{t`AI downloads on this device: ${totalSize}`}</Text>

            {isPositiveNumber(usage.value.unusedBytes) ? (
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

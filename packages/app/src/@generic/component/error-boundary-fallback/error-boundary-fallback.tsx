import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../button/button';
import { Card } from '../card/card';
import { CircleIcon } from '../circle-icon/circle-icon';
import { Page } from '../page/page';

import type { Edge } from 'react-native-safe-area-context';

interface Props {
    readonly error: Error | null;
    readonly onReportBug: () => void;
    readonly onRestart: () => void;
}

export const ErrorBoundaryFallback = ({ error, onReportBug, onRestart }: Props) => {
    const { t } = useLingui();
    const errorMessage = error?.message ?? '';
    const safeEdges: Edge[] = ['top', 'bottom'];

    return (
        <Page safeEdges={safeEdges} className="bg-primary-reverse" contentClassName="justify-center">
            <View className="gap-y-5xl">
                <View className="items-center gap-y-3xl">
                    <CircleIcon icon={UserIconNameEnum.TriangleAlert} variant="destructive" border={false} size={64} iconSize={30} />
                    <View className="gap-y-md">
                        <Text className="text-center text-2xl font-semibold text-primary">
                            <Trans>Something went wrong</Trans>
                        </Text>
                        <Text className="text-center text-sm leading-6 text-secondary-foreground">
                            <Trans>
                                Budgie hit an unexpected problem. You can restart the app or report the issue so we can investigate.
                            </Trans>
                        </Text>
                    </View>
                </View>

                {isNotEmptyString(errorMessage) ? (
                    <Card variant="destructive" size="md">
                        <Text className="font-mono text-xs leading-5 text-destructive-foreground">{errorMessage}</Text>
                    </Card>
                ) : null}

                <View className="gap-y-lg">
                    <Button variant="cta" leftIcon={UserIconNameEnum.Bug} content={t`Report a Bug`} onPress={onReportBug} />
                    <Button variant="ghost" leftIcon={UserIconNameEnum.RefreshCw} content={t`Restart App`} onPress={onRestart} />
                </View>
            </View>
        </Page>
    );
};

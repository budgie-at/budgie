import { Trans, msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Component, ReactNode } from 'react';
import { Linking, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../button/button';
import { CircleIcon } from '../circle-icon/circle-icon';
import { Text } from '../text/text';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

const GITHUB_ISSUE_URL = 'https://github.com/budgie-at/budgie/issues/new/choose';

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error): void {
        console.error('ErrorBoundary caught an error:', error);
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null });
        router.replace('/');
    };

    handleReportBug = (): void => {
        void Linking.openURL(GITHUB_ISSUE_URL);
    };

    render(): ReactNode {
        if (this.state.hasError) {
            return <ErrorBoundaryFallback error={this.state.error} onReset={this.handleReset} onReportBug={this.handleReportBug} />;
        }

        return this.props.children;
    }
}

interface ErrorBoundaryFallbackProps {
    error: Error | null;
    onReset: () => void;
    onReportBug: () => void;
}

function ErrorBoundaryFallback({ error, onReset, onReportBug }: ErrorBoundaryFallbackProps) {
    const { t } = useLingui();

    return (
        <View className="flex-1 items-center justify-center bg-card px-6">
            <CircleIcon name="alert-triangle" className="mb-6 bg-error-base" />

            <Text className="mb-3 text-center text-2xl font-bold text-text-base">
                <Trans>Oops! Something went wrong</Trans>
            </Text>

            <Text className="mb-8 text-center text-base text-text-secondary">
                <Trans>The app encountered an unexpected error. You can try restarting or report this issue to help us fix it.</Trans>
            </Text>

            {isNotEmptyString(error?.message) && (
                <View className="mb-8 w-full rounded-lg bg-error-surface p-4">
                    <Text className="font-mono text-sm text-error-base">{error.message}</Text>
                </View>
            )}

            <View className="w-full gap-3">
                <Button
                    title={t(msg`Report Bug`)}
                    onPress={onReportBug}
                    variant="primary"
                    iconLeft="bug"
                />
                <Button
                    title={t(msg`Restart App`)}
                    onPress={onReset}
                    variant="secondary"
                    iconLeft="refresh-cw"
                />
            </View>
        </View>
    );
}

export const ErrorBoundary = ErrorBoundaryClass;

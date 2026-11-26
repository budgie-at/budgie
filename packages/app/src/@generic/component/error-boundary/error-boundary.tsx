import { logAndContinue } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { Component } from 'react';

import { appRuntime } from '../../runtime/app.runtime';
import { openGithubIssueCreation } from '../../utils/open-github-issue-creation.util';
import { ErrorBoundaryFallback } from '../error-boundary-fallback/error-boundary-fallback';

import type { ErrorBoundaryStateInterface } from './interface/error-boundary-state.interface';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly resetKey?: string;
}

export class ErrorBoundary extends Component<Props, ErrorBoundaryStateInterface> {
    override readonly state: ErrorBoundaryStateInterface = {
        error: null,
        hasError: false,
        resetKey: void 0
    };

    override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        appRuntime.runFork(Effect.logError('throw', { error, componentStack: errorInfo.componentStack }));
    }

    handleReportBug = (): void => {
        appRuntime.runFork(logAndContinue(openGithubIssueCreation));
    };

    handleRetry = (): void => {
        this.setState({
            error: null,
            hasError: false
        });
    };

    handleRestart = (): void => {
        this.setState({
            error: null,
            hasError: false
        });
        router.replace('/');
    };

    override render(): ReactNode {
        if (this.state.hasError) {
            return (
                <ErrorBoundaryFallback
                    error={this.state.error}
                    onReportBug={this.handleReportBug}
                    onRetry={this.handleRetry}
                    onRestart={this.handleRestart}
                />
            );
        }

        return this.props.children;
    }

    static getDerivedStateFromError(error: Error): Pick<ErrorBoundaryStateInterface, 'error' | 'hasError'> {
        return {
            error,
            hasError: true
        };
    }

    static getDerivedStateFromProps(props: Props, state: ErrorBoundaryStateInterface): Partial<ErrorBoundaryStateInterface> | null {
        if (state.hasError && props.resetKey !== state.resetKey) {
            return {
                error: null,
                hasError: false,
                resetKey: props.resetKey
            };
        }

        if (props.resetKey !== state.resetKey) {
            return {
                resetKey: props.resetKey
            };
        }

        return null;
    }
}

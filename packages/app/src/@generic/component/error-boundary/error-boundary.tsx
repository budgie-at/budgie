import { getLogger } from '@budgie/logger';
import { router } from 'expo-router';
import { Component } from 'react';

import { openGithubIssueCreation } from '../../utils/open-github-issue-creation.util';
import { ErrorBoundaryFallback } from '../error-boundary-fallback/error-boundary-fallback';

import type { ErrorBoundaryStateInterface } from './interface/error-boundary-state.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

const logger = getLogger('ErrorBoundary');

export class ErrorBoundary extends Component<Props, ErrorBoundaryStateInterface> {
    override readonly state: ErrorBoundaryStateInterface = {
        error: null,
        hasError: false
    };

    override componentDidCatch(error: Error): void {
        logger.error('throw', error);
    }

    handleReportBug = (): void => {
        void openGithubIssueCreation().catch((error: unknown) => void logger.error('throw', error));
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
            return <ErrorBoundaryFallback error={this.state.error} onReportBug={this.handleReportBug} onRestart={this.handleRestart} />;
        }

        return this.props.children;
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryStateInterface {
        return {
            error,
            hasError: true
        };
    }
}

import { Trans } from '@lingui/react/macro';
import { Shield } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Motion } from '../motion/motion';

const initialMotion = { opacity: 0, y: 20 };
const animatedMotion = { opacity: 1, y: 0 };
const transitionMotion = { duration: 0.5 };
const viewportOnce = { once: true };

interface Props {
    readonly locale: string;
}

export const SecuritySectionHeader = ({ locale }: Props) => (
    <Motion
        className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
        initial={initialMotion}
        transition={transitionMotion}
        viewport={viewportOnce}
        whileInView={animatedMotion}
    >
        <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
            <Shield className="size-3 mr-1" />
            <Trans>Security & Privacy</Trans>
        </Badge>

        <h2 className="text-3xl md:text-4xl font-bold tracking-tight max-w-3xl">
            <Trans>Bank-Level Security Without the Bank</Trans>
        </h2>

        <p className="max-w-[800px] text-muted-foreground md:text-lg">
            <Trans>
                Your financial data never leaves your device. No servers, no cloud, no tracking—just complete privacy with enterprise-grade
                security features.
            </Trans>
        </p>

        <Button asChild className="rounded-full" variant="outline">
            <Link href={`/${locale}/security`}>
                <Trans>Learn More</Trans>
            </Link>
        </Button>
    </Motion>
);

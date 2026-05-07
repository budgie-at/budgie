import { Trans } from '@lingui/react/macro';
import { Code2, Eye, Github, Heart, Shield, Users } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Motion } from '../motion/motion';

import { OpenSourceFeature } from './open-source-feature';

const contentInitial = { opacity: 0, x: -20 };
const contentAnimate = { opacity: 1, x: 0 };
const contentTransition = { duration: 0.5 };
const viewportOnce = { once: true };

interface Props {
    readonly locale: string;
}

export const OpenSourceContent = ({ locale }: Props) => (
    <Motion initial={contentInitial} transition={contentTransition} viewport={viewportOnce} whileInView={contentAnimate}>
        <Badge className="rounded-full px-4 py-1.5 text-sm font-medium mb-6" variant="secondary">
            <Code2 className="size-3 mr-1" />
            <Trans>Open Source</Trans>
        </Badge>

        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            <Trans>Transparency You Can Verify</Trans>
        </h2>

        <p className="text-muted-foreground md:text-lg mb-8">
            <Trans>
                Unlike closed-source apps, you don&apos;t have to trust our word. Every line of code is public on GitHub. Security
                researchers, developers, and anyone can audit exactly how we handle your data—spoiler: we never see it.
            </Trans>
        </p>

        <div className="space-y-4 mb-8">
            <OpenSourceFeature
                description={<Trans>Review every function that touches your financial data</Trans>}
                icon={<Eye className="size-5 text-primary" />}
                title={<Trans>Full Code Transparency</Trans>}
            />

            <OpenSourceFeature
                description={<Trans>Independent security experts can verify our claims</Trans>}
                icon={<Shield className="size-5 text-primary" />}
                title={<Trans>Security Audits Welcome</Trans>}
            />

            <OpenSourceFeature
                description={<Trans>Join developers worldwide improving the app</Trans>}
                icon={<Users className="size-5 text-primary" />}
                title={<Trans>Community Driven</Trans>}
            />
        </div>

        <div className="hidden md:flex flex-wrap gap-4">
            <Button asChild className="rounded-full" size="lg">
                {/* eslint-disable-next-line lingui/no-unlocalized-strings */}
                <Link href="https://github.com/budgie-at/budgie" rel="noopener noreferrer" target="_blank">
                    <Github className="mr-2 size-5" />
                    <Trans>View on GitHub</Trans>
                </Link>
            </Button>

            <Button asChild className="rounded-full" size="lg" variant="outline">
                {/* eslint-disable-next-line lingui/no-unlocalized-strings */}
                <Link href="https://github.com/sponsors/nickolay-ponomarev" rel="noopener noreferrer" target="_blank">
                    <Heart className="mr-2 size-5" />
                    <Trans>Sponsor Project</Trans>
                </Link>
            </Button>

            <Button asChild className="rounded-full" size="lg" variant="outline">
                <Link href={`/${locale}/open-source`}>
                    <Trans>Learn More</Trans>
                </Link>
            </Button>
        </div>
    </Motion>
);

'use client';

import { Trans } from '@lingui/react/macro';
import { BookOpen, Home } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import linguiConfig from '../../../lingui.config.mjs';
import { Button } from '../../ui/button';

const { locales } = linguiConfig;

export default function NotFound() {
    const params = useParams();
    const rawLang = params.lang;
    const detectedLang = typeof rawLang === 'string' && locales.includes(rawLang) ? rawLang : 'en';

    return (
        <main className="flex-1 flex items-center justify-center py-20 md:py-32">
            <div className="container text-center max-w-2xl px-4 md:px-6">
                <p className="text-8xl font-bold text-primary mb-4">404</p>

                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                    <Trans>Page Not Found</Trans>
                </h1>

                <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                    <Trans>The page you are looking for does not exist or has been moved.</Trans>
                </p>

                <div className="flex gap-4 justify-center">
                    <Button asChild className="rounded-full" size="lg">
                        <Link href={`/${detectedLang}`}>
                            <Home className="mr-2 size-4" />
                            <Trans>Go Home</Trans>
                        </Link>
                    </Button>

                    <Button asChild className="rounded-full" size="lg" variant="outline">
                        <Link href={`/${detectedLang}/blog`}>
                            <BookOpen className="mr-2 size-4" />
                            <Trans>Read Blog</Trans>
                        </Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}

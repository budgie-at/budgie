import { Trans } from '@lingui/react/macro';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Motion } from '../../lib/motion';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { Button } from '../ui/button';

interface MobileMenuProps {
    readonly onClose: () => void;
    readonly locale: string;
}

const animateProps = { opacity: 1, y: 0 };
const exitProps = { opacity: 0, y: -20 };
const initialProps = { opacity: 0, y: -20 };

export const MobileMenu = ({ onClose, locale }: MobileMenuProps) => {
    const homeUrl = `/${locale}`;
    const blogUrl = `/${locale}/blog`;

    return (
        <Motion
            animate={animateProps}
            className="md:hidden absolute top-16 inset-x-0 bg-background/95 backdrop-blur-lg border-b"
            exit={exitProps}
            initial={initialProps}
        >
            <div className="container py-4 flex flex-col gap-4">
                <Link className="py-2 text-sm font-medium" href={`${homeUrl}#features`} onClick={onClose}>
                    <Trans>Features</Trans>
                </Link>

                <Link className="py-2 text-sm font-medium" href={`${homeUrl}#testimonials`} onClick={onClose}>
                    <Trans>Testimonials</Trans>
                </Link>

                <Link className="py-2 text-sm font-medium" href={blogUrl} onClick={onClose}>
                    <Trans>Blog</Trans>
                </Link>

                <Link className="py-2 text-sm font-medium" href={`${homeUrl}#whitelist`} onClick={onClose}>
                    <Trans>Whitelist</Trans>
                </Link>

                <Link className="py-2 text-sm font-medium" href={`${homeUrl}#faq`} onClick={onClose}>
                    <Trans>FAQ</Trans>
                </Link>

                <div className="flex flex-col gap-2 pt-2 border-t">
                    <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        <Trans>Language</Trans>
                    </span>
                        <LanguageSwitcher />
                    </div>

                    <Button className="rounded-full">
                        <Trans>Join Whitelist</Trans>
                        <ChevronRight className="ml-1 size-4" />
                    </Button>
                </div>
            </div>
        </Motion>
    );
};

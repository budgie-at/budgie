/* eslint-disable @rnw-community/no-complex-jsx-logic */

'use client';

import { Trans, useLingui } from '@lingui/react/macro';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '../../../ui/button';

interface Props {
    locale: string;
    searchQuery: string;
    currentPage: number;
}

export const BlogSearch = ({ locale, searchQuery }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [query, setQuery] = useState(searchQuery);

    const handleSearch = (value: string) => {
        setQuery(value);

        startTransition(() => {
            const params = new URLSearchParams();

            if (value) {
                params.set('q', value);
            }
            params.set('page', '1');

            router.push(`/${locale}/blog?${params.toString()}`);
        });
    };

    const handleClear = () => {
        setQuery('');

        startTransition(() => {
            router.push(`/${locale}/blog`);
        });
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />

                <input
                    className="w-full h-12 pl-12 pr-12 rounded-full border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    onChange={e => void handleSearch(e.target.value)}
                    placeholder={t`Search articles...`}
                    type="text"
                    value={query}
                />

                {query && (
                    <Button
                        className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full"
                        onClick={handleClear}
                        size="icon"
                        variant="ghost"
                    >
                        <X className="size-4" />
                    </Button>
                )}

                {isPending && (
                    <div className="absolute right-12 top-1/2 -translate-y-1/2">
                        <div className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                )}
            </div>

            {searchQuery && (
                <p className="text-sm text-muted-foreground mt-4">
                    <Trans>
                        Showing results for: <span className="font-semibold text-foreground">{searchQuery}</span>
                    </Trans>
                </p>
            )}
        </div>
    );
};

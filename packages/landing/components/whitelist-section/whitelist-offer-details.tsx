import { ArrowRight, Check } from 'lucide-react';

import { Button } from '../ui/button';

export const WhitelistOfferDetails = () => (
    <div className="space-y-4">
        <Button
            className="w-full sm:w-auto rounded-full h-14 px-12 text-lg bg-linear-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg"
            size="lg"
        >
            Join Whitelist - Save 25%
            <ArrowRight className="ml-2 size-5" />
        </Button>

        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
                <Check className="size-4 text-primary" />

                <span>No commitment</span>
            </div>

            <div className="flex items-center gap-1">
                <Check className="size-4 text-primary" />

                <span>Cancel anytime</span>
            </div>

            <div className="flex items-center gap-1">
                <Check className="size-4 text-primary" />

                <span>Limited time</span>
            </div>
        </div>
    </div>
);

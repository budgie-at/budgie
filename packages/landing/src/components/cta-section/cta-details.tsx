import { ArrowRight, Github, Smartphone } from 'lucide-react';

import { Button } from '../ui/button';

export const CtaDetails = () => (
    <>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">Take Control of Your Financial Privacy</h2>

        <p className="mx-auto max-w-[700px] text-primary-foreground/80 md:text-xl">
            Join thousands of privacy-conscious users who trust Budgie to track their expenses without compromising their financial data.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button className="rounded-full h-12 px-8 text-base" size="lg" variant="secondary">
                <Smartphone className="mr-2 size-4" />
                Join Whitelist
                <ArrowRight className="ml-2 size-4" />
            </Button>

            <Button
                className="rounded-full h-12 px-8 text-base bg-transparent border-white text-white hover:bg-white/10"
                size="lg"
                variant="outline"
            >
                <Github className="mr-2 size-4" />
                View Source Code
            </Button>
        </div>

        <p className="text-sm text-primary-foreground/80 mt-4">100% secure • Open source • Your data stays on your device</p>
    </>
);

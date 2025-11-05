import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '../ui/button';

interface MobileMenuProps {
    readonly onClose: () => void;
}

export const MobileMenu = ({ onClose }: MobileMenuProps) => (
    <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="md:hidden absolute top-16 inset-x-0 bg-background/95 backdrop-blur-lg border-b"
        exit={{ opacity: 0, y: -20 }}
        initial={{ opacity: 0, y: -20 }}
    >
        <div className="container py-4 flex flex-col gap-4">
            <Link className="py-2 text-sm font-medium" href="#features" onClick={onClose}>
                Features
            </Link>

            <Link className="py-2 text-sm font-medium" href="#testimonials" onClick={onClose}>
                Testimonials
            </Link>

            <Link className="py-2 text-sm font-medium" href="#whitelist" onClick={onClose}>
                Whitelist
            </Link>

            <Link className="py-2 text-sm font-medium" href="#faq" onClick={onClose}>
                FAQ
            </Link>

            <div className="flex flex-col gap-2 pt-2 border-t">
                <Button className="rounded-full">
                    Join Whitelist
                    <ChevronRight className="ml-1 size-4" />
                </Button>
            </div>
        </div>
    </motion.div>
);

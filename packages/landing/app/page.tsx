'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Banknote,
    Check,
    ChevronRight,
    Clock,
    Github,
    Layers,
    Menu,
    Moon,
    Shield,
    Smartphone,
    Sparkles,
    Star,
    Sun,
    Target,
    TrendingUp,
    WifiOff,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from 'next-themes';

export default function LandingPage() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const features = [
        {
            title: 'Offline-First Design',
            description: "Track expenses anywhere, anytime. Your data syncs when you're back online.",
            icon: <WifiOff className="size-5" />
        },
        {
            title: 'Bank Synchronization',
            description: 'Automatically import transactions from your bank accounts for effortless tracking.',
            icon: <Banknote className="size-5" />
        },
        {
            title: 'Multi-Asset Tracking',
            description: 'Monitor cash, crypto, stocks, and bank accounts all in one place.',
            icon: <Layers className="size-5" />
        },
        {
            title: 'Complete Privacy',
            description: 'Your financial data stays on your device. No cloud storage, no data mining.',
            icon: <Shield className="size-5" />
        },
        {
            title: 'Multi-Currency Support',
            description: 'Track expenses in any currency with real-time exchange rates.',
            icon: <TrendingUp className="size-5" />
        },
        {
            title: 'Goals & Debt Tracking',
            description: 'Set financial goals and track debt payments to achieve financial freedom.',
            icon: <Target className="size-5" />
        }
    ];

    return (
        <div className="flex min-h-[100dvh] flex-col">
            <header
                className={`sticky top-0 z-50 w-full backdrop-blur-lg transition-all duration-300 ${isScrolled ? 'bg-background/80 shadow-sm' : 'bg-transparent'}`}
            >
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold">
                        <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground">
                            <svg width="800" height="800" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M181.832 0.680513C182.214 0.642018 182.596 0.60664 182.98 0.585832C193.871 -0.00719953 204.866 0.257071 215.77 0.269556L554.551 0.275795C588.69 0.266431 623.833 -1.70722 657.498 5.0419C689.522 11.4612 718.701 25.3746 742.966 48.0336C781.565 84.0795 796.872 132.766 799.241 185.11C800.662 216.501 799.653 248.376 799.648 279.818L799.659 564.6C799.663 596.326 801.365 628.95 795.188 660.208C789.36 690.345 775.7 718.294 755.661 741.08C719.13 782.287 671.499 796.657 618.93 799.131C618.117 799.197 617.304 799.254 616.49 799.304C605.713 799.956 594.769 799.721 583.975 799.723L248.816 799.732C213.269 799.738 176.453 801.746 141.413 794.679C109.745 788.292 79.8618 774.117 55.7349 751.871C20.3546 719.248 3.32825 673.637 0.894324 625.601C-0.692226 594.296 0.315921 562.58 0.313898 531.219L0.305813 247.386C0.31188 213.441 -1.38691 178.57 5.06951 145.112C11.083 113.949 24.0242 85.1095 44.802 61.4163C81.3382 19.7522 128.636 3.52811 181.832 0.680513Z"
                                    fill="white"
                                />
                                <path
                                    d="M451.623 306.504L452.408 306.455C461.283 305.939 493.062 305.528 500.396 307.178C504.228 308.041 507.893 309.866 510.774 312.629C523.717 325.043 514.802 346.454 515.306 361.928C515.447 366.263 516.544 370.656 519.856 373.591C522.315 375.772 525.6 376.9 528.829 376.829C536.134 376.67 544.324 373.196 551.527 371.534C560.632 369.434 570.248 368.145 579.557 367.445C608.228 365.286 639.435 369.288 661.864 389.41C677.562 403.494 686.211 423.527 687.555 444.759C688.569 460.778 684.761 477.077 678.931 491.84C659.177 541.856 615.445 575.912 567.967 595.432C561.027 598.285 553.611 600.329 546.333 602.081C541.954 603.135 537.146 603.867 532.959 605.541C531.216 606.237 529.476 607.235 528.289 608.756C527.25 610.087 526.75 611.679 527.065 613.384C527.585 616.194 529.882 618.484 531.99 620.156C547.404 632.386 562.522 625.113 574.316 634.094C578.795 637.505 581.588 642 582.348 647.705C583.257 654.13 581.484 660.65 577.468 665.656C573.057 671.188 567.893 673 561.213 673.492C546.992 674.539 532.148 673.679 517.876 673.678L372.807 673.632C362.742 673.658 351.849 674.629 341.865 673.459C337.084 672.899 332.509 670.987 328.925 667.643C323.79 662.852 322.307 656.811 322.047 649.967C323.223 639.278 330.042 631.447 340.464 629.623C344.782 628.867 349.224 628.928 353.532 628.151C360.156 626.955 369.883 623.011 374.242 617.539C375.715 615.688 376.667 613.368 376.277 610.941C375.911 608.674 374.408 607.318 372.516 606.312C366.929 603.341 359.703 602.461 353.677 600.49C343.052 597.018 332.778 591.488 323.324 585.448C311.849 578.12 301.534 568.456 292.636 558.042C280.659 544.023 271.014 528.924 254.765 519.51C242.84 512.603 229.558 509.378 216.702 504.87C194.518 497.091 172.677 487.276 153.323 473.538C131.308 457.912 110.41 434.579 105.562 406.586C102.61 390.301 106.215 373.482 115.552 359.986C124.088 347.408 136.782 338.526 150.913 333.883C167.875 328.311 186.561 328.497 203.62 333.515C220.497 338.48 235.934 347.416 251.313 355.899C285.781 374.914 323.012 392.985 363.284 385.282C390.442 380.089 413.739 363.378 426.27 337.824C429.985 330.25 431.804 321.431 436.653 314.527C440.151 309.549 445.929 307.351 451.623 306.504Z"
                                    fill="black"
                                />
                                <path
                                    d="M556.391 437.647C565.46 437.031 575.48 438.773 583.326 443.67C591.289 448.605 596.972 456.644 599.083 465.958C602.051 478.759 598.127 491.913 591.597 502.862C578.575 524.695 555.395 538.008 531.748 543.838C531.131 543.957 530.513 544.07 529.894 544.18C521.731 545.621 500.351 548.844 493.403 543.373C491.334 541.744 489.928 539.175 489.687 536.509C488.879 527.55 499.256 479.011 502.562 469.939C504.445 464.773 507.396 459.784 510.897 455.61C522.356 441.942 539.818 439.007 556.391 437.647Z"
                                    fill="white"
                                />
                                <path
                                    d="M171.005 377.23C175.213 376.766 179.464 376.959 183.613 377.805C203.245 381.744 220.604 397.372 231.423 414.069C236.272 421.551 251.206 449.496 249.1 458.435C248.781 459.788 248.026 460.991 246.8 461.645C243.008 463.668 236.317 460.974 232.398 459.908C217.511 455.371 203.092 449.931 189.581 441.971C175.365 433.596 156.499 418.898 152.276 401.58C151.082 396.685 151.296 391.457 154.025 387.131C157.843 381.081 164.432 378.527 171.005 377.23Z"
                                    fill="white"
                                />
                                <path
                                    d="M562.731 130.112C604.207 126.88 640.358 158.899 643.419 201.579C646.481 244.259 615.292 281.394 573.805 284.462C532.431 287.522 496.459 255.537 493.405 212.973C490.351 170.409 521.368 133.337 562.731 130.112Z"
                                    fill="black"
                                />
                                <path
                                    d="M562.558 175.947C579.524 172.643 595.886 184.098 599.127 201.548C602.366 218.997 591.263 235.852 574.309 239.217C557.312 242.59 540.882 231.131 537.633 213.637C534.384 196.144 545.551 179.259 562.558 175.947Z"
                                    fill="white"
                                />
                            </svg>
                        </div>
                        <span>Budgie</span>
                    </div>
                    <nav className="hidden md:flex gap-8">
                        <Link
                            href="#features"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Features
                        </Link>
                        <Link
                            href="#testimonials"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Testimonials
                        </Link>
                        <Link
                            href="#whitelist"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Whitelist
                        </Link>
                        <Link href="#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                            FAQ
                        </Link>
                    </nav>
                    <div className="hidden md:flex gap-4 items-center">
                        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                            {mounted && theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                        <Button className="rounded-full">
                            Download App
                            <ChevronRight className="ml-1 size-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-4 md:hidden">
                        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                            {mounted && theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </div>
                </div>
                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden absolute top-16 inset-x-0 bg-background/95 backdrop-blur-lg border-b"
                    >
                        <div className="container py-4 flex flex-col gap-4">
                            <Link href="#features" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                                Features
                            </Link>
                            <Link href="#testimonials" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                                Testimonials
                            </Link>
                            <Link href="#whitelist" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                                Whitelist
                            </Link>
                            <Link href="#faq" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
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
                )}
            </header>
            <main className="flex-1">
                {/* Hero Section */}
                <section className="w-full py-20 md:py-32 lg:py-40 overflow-hidden">
                    <div className="container py-6 px-4 md:px-6 relative">
                        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-center max-w-3xl mx-auto mb-12"
                        >
                            <Badge className="mb-4 rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                                <Github className="size-3 mr-1" />
                                Open Source & Private
                            </Badge>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                Your Money, Your Privacy, Your Control
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                                Budgie is the offline-first expense tracker that keeps your financial data completely private. Track cash,
                                crypto, stocks, and bank accounts across multiple currencies—all stored securely on your device.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button size="lg" className="rounded-full h-12 px-8 text-base">
                                    <Smartphone className="mr-2 size-4" />
                                    Join Whitelist
                                    <ArrowRight className="ml-2 size-4" />
                                </Button>
                                <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base bg-transparent">
                                    <Github className="mr-2 size-4" />
                                    View Source Code
                                </Button>
                            </div>
                            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Check className="size-4 text-primary" />
                                    <span>100% Secure</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Check className="size-4 text-primary" />
                                    <span>Open Source</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Check className="size-4 text-primary" />
                                    <span>Privacy First</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="relative mx-auto max-w-lg"
                        >
                            <div className="rounded-xl overflow-hidden shadow-2xl border border-border/40 bg-gradient-to-b from-background to-muted/20">
                                <Image
                                    src="/images/design-mode/photo_2025-09-26_21-57-24.jpg"
                                    width={1280}
                                    height={720}
                                    alt="Budgie mobile app interface showing balance overview with multi-currency bank accounts including Monobank cards and various account types"
                                    className="w-full h-auto"
                                    priority
                                />
                                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10 dark:ring-white/10"></div>
                            </div>
                            <div className="absolute -bottom-6 -right-6 -z-10 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-3xl opacity-70"></div>
                            <div className="absolute -top-6 -left-6 -z-10 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-secondary/30 to-primary/30 blur-3xl opacity-70"></div>
                        </motion.div>
                    </div>
                </section>

                {/* Logos Section */}
                <section className="w-full py-12 border-y bg-muted/30">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                            <p className="text-sm font-medium text-muted-foreground">Syncs with 1000+ banks and financial institutions</p>
                            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
                                {['Chase', 'Bank of America', 'Wells Fargo', 'Coinbase', 'Robinhood'].map((bank, i) => (
                                    <div
                                        key={i}
                                        className="h-8 px-4 flex items-center justify-center bg-muted/50 rounded text-sm font-medium text-muted-foreground"
                                    >
                                        {bank}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="w-full py-20 md:py-32">
                    <div className="container px-4 md:px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
                        >
                            <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                                Features
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything You Need to Master Your Finances</h2>
                            <p className="max-w-[800px] text-muted-foreground md:text-lg">
                                Budgie combines powerful expense tracking with complete privacy. Track every dollar, euro, or bitcoin while
                                keeping your financial data exactly where it belongs—on your device.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={container}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true }}
                            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            {features.map((feature, i) => (
                                <motion.div key={i} variants={item}>
                                    <Card className="h-full overflow-hidden border-border/40 bg-gradient-to-b from-background to-muted/10 backdrop-blur transition-all hover:shadow-md">
                                        <CardContent className="p-6 flex flex-col h-full">
                                            <div className="size-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-4">
                                                {feature.icon}
                                            </div>
                                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                            <p className="text-muted-foreground">{feature.description}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="w-full py-20 md:py-32 bg-muted/30 relative overflow-hidden">
                    <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]"></div>

                    <div className="container px-4 md:px-6 relative">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
                        >
                            <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                                How It Works
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Start Tracking in Minutes</h2>
                            <p className="max-w-[800px] text-muted-foreground md:text-lg">
                                Get complete control over your finances with just a few simple steps. No accounts, no cloud storage, no
                                compromises.
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
                            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 z-0"></div>

                            {[
                                {
                                    step: '01',
                                    title: 'Download & Install',
                                    description: 'Get Budgie from the app store. No registration required—your privacy starts immediately.'
                                },
                                {
                                    step: '02',
                                    title: 'Connect Your Accounts',
                                    description:
                                        'Securely link your bank accounts, crypto wallets, and investment accounts for automatic tracking.'
                                },
                                {
                                    step: '03',
                                    title: 'Track Everything',
                                    description:
                                        'Monitor expenses, set goals, track debts, and gain insights—all while keeping your data private.'
                                }
                            ].map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="relative z-10 flex flex-col items-center text-center space-y-4"
                                >
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xl font-bold shadow-lg">
                                        {step.step}
                                    </div>
                                    <h3 className="text-xl font-bold">{step.title}</h3>
                                    <p className="text-muted-foreground">{step.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* AI Assistant Section */}
                <section className="w-full py-20 md:py-32">
                    <div className="container px-4 md:px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center justify-center space-y-4 text-center mb-16"
                        >
                            <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                                <Sparkles className="size-3 mr-1" />
                                AI Assistant
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Smart Financial Insights, Privately Powered</h2>
                            <p className="max-w-[800px] text-muted-foreground md:text-lg">
                                Get instant answers about your spending with Budgie's on-device AI. No data leaves your phone—smart analysis
                                happens locally for complete privacy.
                            </p>
                        </motion.div>

                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-1">
                                            <Sparkles className="size-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold mb-2">Instant Financial Analysis</h3>
                                            <p className="text-muted-foreground">
                                                Ask questions like "Why is there so little money?" and get detailed breakdowns of your
                                                spending patterns, unusual transactions, and budget insights.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-1">
                                            <Shield className="size-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold mb-2">100% On-Device Processing</h3>
                                            <p className="text-muted-foreground">
                                                Your financial data never leaves your device. The AI runs locally, ensuring your spending
                                                habits and financial questions remain completely private.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-1">
                                            <TrendingUp className="size-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold mb-2">Smart Spending Advice</h3>
                                            <p className="text-muted-foreground">
                                                Get personalized recommendations like "Don't give a girl so much money!" and other practical
                                                insights to help you make better financial decisions.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-muted/50 rounded-xl border border-border/40">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Sparkles className="size-4 text-primary" />
                                        Example AI Conversations
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex gap-3">
                                            <div className="text-muted-foreground">You:</div>
                                            <div>"Why did I spend so much this month?"</div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="text-primary font-medium">AI:</div>
                                            <div className="text-muted-foreground">
                                                "You spent 40% more on dining out ($320 vs $230 average). Your largest expense was $85 at
                                                Fancy Restaurant on the 15th."
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="relative"
                            >
                                <div className="relative mx-auto max-w-sm">
                                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/40 bg-gradient-to-b from-background to-muted/20">
                                        <div className="bg-gradient-to-r from-primary to-secondary p-4 text-primary-foreground">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-white/20 flex items-center justify-center">
                                                    <Sparkles className="size-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">Budgie AI</div>
                                                    <div className="text-xs opacity-80">On-device assistant</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-4 bg-background">
                                            <div className="flex justify-end">
                                                <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm max-w-[80%]">
                                                    Why is there so little money left?
                                                </div>
                                            </div>
                                            <div className="flex justify-start">
                                                <div className="bg-muted px-3 py-2 rounded-lg text-sm max-w-[80%]">
                                                    I analyzed your spending and found you spent $450 more than usual this month. The main
                                                    culprits: $280 on entertainment and $170 on impulse purchases. Want me to show you the
                                                    breakdown?
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm max-w-[80%]">
                                                    Yes, show me the details
                                                </div>
                                            </div>
                                            <div className="flex justify-start">
                                                <div className="bg-muted px-3 py-2 rounded-lg text-sm max-w-[80%]">
                                                    Here's your spending spike: 🎬 Movies & concerts: $180 🛍️ Online shopping: $120 🍕 Food
                                                    delivery: $100. Consider setting a $200 entertainment budget next month?
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-6 -right-6 -z-10 h-[200px] w-[200px] rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-3xl opacity-70"></div>
                                    <div className="absolute -top-6 -left-6 -z-10 h-[200px] w-[200px] rounded-full bg-gradient-to-br from-secondary/30 to-primary/30 blur-3xl opacity-70"></div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section id="testimonials" className="w-full py-20 md:py-32">
                    <div className="container px-4 md:px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
                        >
                            <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                                Testimonials
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Trusted by Privacy-Conscious Users</h2>
                            <p className="max-w-[800px] text-muted-foreground md:text-lg">
                                See what users love about Budgie's approach to private, comprehensive expense tracking.
                            </p>
                        </motion.div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    quote: "Finally, an expense tracker that doesn't spy on me! Budgie works perfectly offline and my bank sync is seamless. Love the multi-currency support.",
                                    author: 'Sarah Chen',
                                    role: 'Digital Nomad',
                                    rating: 5
                                },
                                {
                                    quote: 'The crypto tracking is incredible. I can see all my DeFi positions alongside my traditional accounts. The privacy-first approach sold me immediately.',
                                    author: 'Marcus Rodriguez',
                                    role: 'Crypto Investor',
                                    rating: 5
                                },
                                {
                                    quote: 'As a freelancer with multiple currencies, Budgie is a lifesaver. The debt tracking helped me pay off my student loans 6 months early!',
                                    author: 'Emily Johnson',
                                    role: 'Freelance Designer',
                                    rating: 5
                                },
                                {
                                    quote: 'Open source AND private? This is exactly what I was looking for. The goal tracking feature keeps me motivated to save for my house down payment.',
                                    author: 'David Kim',
                                    role: 'Software Engineer',
                                    rating: 5
                                },
                                {
                                    quote: "I've tried every expense app out there. Budgie is the only one that works completely offline while still syncing my bank accounts when I'm online.",
                                    author: 'Lisa Patel',
                                    role: 'Travel Blogger',
                                    rating: 5
                                },
                                {
                                    quote: 'The stock portfolio tracking alongside my daily expenses gives me a complete financial picture. Plus, knowing my data never leaves my phone is priceless.',
                                    author: 'James Wilson',
                                    role: 'Investment Advisor',
                                    rating: 5
                                }
                            ].map((testimonial, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                >
                                    <Card className="h-full overflow-hidden border-border/40 bg-gradient-to-b from-background to-muted/10 backdrop-blur transition-all hover:shadow-md">
                                        <CardContent className="p-6 flex flex-col h-full">
                                            <div className="flex mb-4">
                                                {Array(testimonial.rating)
                                                    .fill(0)
                                                    .map((_, j) => (
                                                        <Star key={j} className="size-4 text-yellow-500 fill-yellow-500" />
                                                    ))}
                                            </div>
                                            <p className="text-lg mb-6 flex-grow">{testimonial.quote}</p>
                                            <div className="flex items-center gap-4 mt-auto pt-4 border-t border-border/40">
                                                <div className="size-10 rounded-full bg-muted flex items-center justify-center text-foreground font-medium">
                                                    {testimonial.author.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{testimonial.author}</p>
                                                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Whitelist Section */}
                <section
                    id="whitelist"
                    className="w-full py-20 md:py-32 bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 relative overflow-hidden"
                >
                    <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]"></div>

                    <div className="container px-4 md:px-6 relative">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="max-w-4xl mx-auto"
                        >
                            <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-background via-background to-primary/5 backdrop-blur shadow-2xl">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-primary-foreground px-8 py-3 text-sm font-bold rounded-b-xl shadow-lg">
                                    🎉 EXCLUSIVE WHITELIST OFFER
                                </div>

                                <CardContent className="p-8 md:p-12">
                                    <div className="text-center space-y-6">
                                        <div className="space-y-4">
                                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                                                Join the Whitelist & Save 25%
                                            </h2>
                                            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                                                Be among the first to experience Budgie Pro with exclusive early access pricing. Limited
                                                spots available for privacy-conscious early adopters.
                                            </p>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-8">
                                            <div className="text-center">
                                                <div className="text-sm text-muted-foreground mb-2">Regular Price</div>
                                                <div className="text-3xl font-bold text-muted-foreground line-through">$20/month</div>
                                            </div>

                                            <div className="hidden sm:block text-4xl text-primary">→</div>

                                            <div className="text-center">
                                                <div className="text-sm text-primary font-medium mb-2">Whitelist Price</div>
                                                <div className="text-4xl md:text-5xl font-bold text-primary">$15/month</div>
                                                <div className="text-sm text-primary font-medium">25% off for the first year</div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-6 py-6">
                                            {[
                                                {
                                                    icon: <Clock className="size-6" />,
                                                    title: 'Early Access',
                                                    description: 'Get Budgie Pro before the public launch'
                                                },
                                                {
                                                    icon: <Sparkles className="size-6" />,
                                                    title: 'First Year Discount',
                                                    description: '25% off your first year of Budgie Pro'
                                                },
                                                {
                                                    icon: <Shield className="size-6" />,
                                                    title: 'Priority Support',
                                                    description: 'Direct line to our development team'
                                                }
                                            ].map((benefit, i) => (
                                                <div key={i} className="text-center space-y-3">
                                                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                                                        {benefit.icon}
                                                    </div>
                                                    <h3 className="font-semibold">{benefit.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <Button
                                                size="lg"
                                                className="w-full sm:w-auto rounded-full h-14 px-12 text-lg bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg"
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

                                        <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border/40">
                                            <p className="text-sm text-muted-foreground">
                                                <strong className="text-foreground">Limited Offer:</strong> Only 500 whitelist spots
                                                available. Get 25% off your first year of Budgie Pro when you join the whitelist.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section id="faq" className="w-full py-20 md:py-32">
                    <div className="container px-4 md:px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
                        >
                            <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                                FAQ
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
                            <p className="max-w-[800px] text-muted-foreground md:text-lg">
                                Everything you need to know about Budgie's privacy-first approach to expense tracking.
                            </p>
                        </motion.div>

                        <div className="mx-auto max-w-3xl">
                            <Accordion type="single" collapsible className="w-full">
                                {[
                                    {
                                        question: 'How much does Budgie cost?',
                                        answer: 'Budgie Pro costs $20/month or $16/month when billed annually (20% savings). Whitelist members get an exclusive 25% discount for their first year. This premium pricing ensures we can maintain the highest privacy and security standards without relying on data monetization.'
                                    },
                                    {
                                        question: "Why isn't Budgie free like other expense trackers?",
                                        answer: "Free expense apps make money by selling your financial data or showing ads. Budgie's premium model means we work for you, not advertisers. Your subscription funds ongoing development, security updates, and ensures your data remains completely private—never sold or monetized."
                                    },
                                    {
                                        question: 'How is my financial data kept private?',
                                        answer: "Your data never leaves your device unless you explicitly sync with your own cloud storage. We don't have servers storing your financial information, and we can't see your transactions. Everything is encrypted locally on your device."
                                    },
                                    {
                                        question: 'Does bank sync work offline?',
                                        answer: 'Bank sync requires an internet connection to fetch new transactions, but once synced, you can view and categorize everything offline. The app works completely offline for manual expense entry and viewing your data.'
                                    },
                                    {
                                        question: 'What cryptocurrencies and assets can I track?',
                                        answer: 'Budgie supports tracking for major cryptocurrencies, stocks, ETFs, and traditional bank accounts. You can manually add any asset or connect supported exchanges and brokerages for automatic tracking.'
                                    },
                                    {
                                        question: 'Can I use Budgie across multiple devices?',
                                        answer: 'Yes! You can sync your data across devices using your own cloud storage (iCloud, Google Drive, Dropbox). Your data remains encrypted and private—we never see it during the sync process.'
                                    },
                                    {
                                        question: 'How does the open source license work?',
                                        answer: 'Budgie uses a source-available license that allows you to view, modify, and contribute to the code while ensuring only we can monetize the official app. This keeps the project sustainable while maintaining transparency.'
                                    },
                                    {
                                        question: 'Is there a free trial or money-back guarantee?',
                                        answer: "We offer a 14-day free trial so you can experience Budgie's privacy-first approach risk-free. If you're not completely satisfied within 30 days, we provide a full refund—no questions asked."
                                    }
                                ].map((faq, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.3, delay: i * 0.05 }}
                                    >
                                        <AccordionItem value={`item-${i}`} className="border-b border-border/40 py-2">
                                            <AccordionTrigger className="text-left font-medium hover:no-underline">
                                                {faq.question}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                                        </AccordionItem>
                                    </motion.div>
                                ))}
                            </Accordion>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="w-full py-20 md:py-32 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground relative overflow-hidden">
                    <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

                    <div className="container px-4 md:px-6 relative">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center justify-center space-y-6 text-center"
                        >
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                                Take Control of Your Financial Privacy
                            </h2>
                            <p className="mx-auto max-w-[700px] text-primary-foreground/80 md:text-xl">
                                Join thousands of privacy-conscious users who trust Budgie to track their expenses without compromising
                                their financial data.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 mt-4">
                                <Button size="lg" variant="secondary" className="rounded-full h-12 px-8 text-base">
                                    <Smartphone className="mr-2 size-4" />
                                    Join Whitelist
                                    <ArrowRight className="ml-2 size-4" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="rounded-full h-12 px-8 text-base bg-transparent border-white text-white hover:bg-white/10"
                                >
                                    <Github className="mr-2 size-4" />
                                    View Source Code
                                </Button>
                            </div>
                            <p className="text-sm text-primary-foreground/80 mt-4">
                                100% secure • Open source • Your data stays on your device
                            </p>
                        </motion.div>
                    </div>
                </section>
            </main>
            <footer className="w-full border-t bg-background/95 backdrop-blur-sm">
                <div className="container flex flex-col gap-8 px-4 py-10 md:px-6 lg:py-16">
                    <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 font-bold">
                                <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground">
                                    <svg width="800" height="800" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M181.832 0.680513C182.214 0.642018 182.596 0.60664 182.98 0.585832C193.871 -0.00719953 204.866 0.257071 215.77 0.269556L554.551 0.275795C588.69 0.266431 623.833 -1.70722 657.498 5.0419C689.522 11.4612 718.701 25.3746 742.966 48.0336C781.565 84.0795 796.872 132.766 799.241 185.11C800.662 216.501 799.653 248.376 799.648 279.818L799.659 564.6C799.663 596.326 801.365 628.95 795.188 660.208C789.36 690.345 775.7 718.294 755.661 741.08C719.13 782.287 671.499 796.657 618.93 799.131C618.117 799.197 617.304 799.254 616.49 799.304C605.713 799.956 594.769 799.721 583.975 799.723L248.816 799.732C213.269 799.738 176.453 801.746 141.413 794.679C109.745 788.292 79.8618 774.117 55.7349 751.871C20.3546 719.248 3.32825 673.637 0.894324 625.601C-0.692226 594.296 0.315921 562.58 0.313898 531.219L0.305813 247.386C0.31188 213.441 -1.38691 178.57 5.06951 145.112C11.083 113.949 24.0242 85.1095 44.802 61.4163C81.3382 19.7522 128.636 3.52811 181.832 0.680513Z"
                                            fill="white"
                                        />
                                        <path
                                            d="M451.623 306.504L452.408 306.455C461.283 305.939 493.062 305.528 500.396 307.178C504.228 308.041 507.893 309.866 510.774 312.629C523.717 325.043 514.802 346.454 515.306 361.928C515.447 366.263 516.544 370.656 519.856 373.591C522.315 375.772 525.6 376.9 528.829 376.829C536.134 376.67 544.324 373.196 551.527 371.534C560.632 369.434 570.248 368.145 579.557 367.445C608.228 365.286 639.435 369.288 661.864 389.41C677.562 403.494 686.211 423.527 687.555 444.759C688.569 460.778 684.761 477.077 678.931 491.84C659.177 541.856 615.445 575.912 567.967 595.432C561.027 598.285 553.611 600.329 546.333 602.081C541.954 603.135 537.146 603.867 532.959 605.541C531.216 606.237 529.476 607.235 528.289 608.756C527.25 610.087 526.75 611.679 527.065 613.384C527.585 616.194 529.882 618.484 531.99 620.156C547.404 632.386 562.522 625.113 574.316 634.094C578.795 637.505 581.588 642 582.348 647.705C583.257 654.13 581.484 660.65 577.468 665.656C573.057 671.188 567.893 673 561.213 673.492C546.992 674.539 532.148 673.679 517.876 673.678L372.807 673.632C362.742 673.658 351.849 674.629 341.865 673.459C337.084 672.899 332.509 670.987 328.925 667.643C323.79 662.852 322.307 656.811 322.047 649.967C323.223 639.278 330.042 631.447 340.464 629.623C344.782 628.867 349.224 628.928 353.532 628.151C360.156 626.955 369.883 623.011 374.242 617.539C375.715 615.688 376.667 613.368 376.277 610.941C375.911 608.674 374.408 607.318 372.516 606.312C366.929 603.341 359.703 602.461 353.677 600.49C343.052 597.018 332.778 591.488 323.324 585.448C311.849 578.12 301.534 568.456 292.636 558.042C280.659 544.023 271.014 528.924 254.765 519.51C242.84 512.603 229.558 509.378 216.702 504.87C194.518 497.091 172.677 487.276 153.323 473.538C131.308 457.912 110.41 434.579 105.562 406.586C102.61 390.301 106.215 373.482 115.552 359.986C124.088 347.408 136.782 338.526 150.913 333.883C167.875 328.311 186.561 328.497 203.62 333.515C220.497 338.48 235.934 347.416 251.313 355.899C285.781 374.914 323.012 392.985 363.284 385.282C390.442 380.089 413.739 363.378 426.27 337.824C429.985 330.25 431.804 321.431 436.653 314.527C440.151 309.549 445.929 307.351 451.623 306.504Z"
                                            fill="black"
                                        />
                                        <path
                                            d="M556.391 437.647C565.46 437.031 575.48 438.773 583.326 443.67C591.289 448.605 596.972 456.644 599.083 465.958C602.051 478.759 598.127 491.913 591.597 502.862C578.575 524.695 555.395 538.008 531.748 543.838C531.131 543.957 530.513 544.07 529.894 544.18C521.731 545.621 500.351 548.844 493.403 543.373C491.334 541.744 489.928 539.175 489.687 536.509C488.879 527.55 499.256 479.011 502.562 469.939C504.445 464.773 507.396 459.784 510.897 455.61C522.356 441.942 539.818 439.007 556.391 437.647Z"
                                            fill="white"
                                        />
                                        <path
                                            d="M171.005 377.23C175.213 376.766 179.464 376.959 183.613 377.805C203.245 381.744 220.604 397.372 231.423 414.069C236.272 421.551 251.206 449.496 249.1 458.435C248.781 459.788 248.026 460.991 246.8 461.645C243.008 463.668 236.317 460.974 232.398 459.908C217.511 455.371 203.092 449.931 189.581 441.971C175.365 433.596 156.499 418.898 152.276 401.58C151.082 396.685 151.296 391.457 154.025 387.131C157.843 381.081 164.432 378.527 171.005 377.23Z"
                                            fill="white"
                                        />
                                        <path
                                            d="M562.731 130.112C604.207 126.88 640.358 158.899 643.419 201.579C646.481 244.259 615.292 281.394 573.805 284.462C532.431 287.522 496.459 255.537 493.405 212.973C490.351 170.409 521.368 133.337 562.731 130.112Z"
                                            fill="black"
                                        />
                                        <path
                                            d="M562.558 175.947C579.524 172.643 595.886 184.098 599.127 201.548C602.366 218.997 591.263 235.852 574.309 239.217C557.312 242.59 540.882 231.131 537.633 213.637C534.384 196.144 545.551 179.259 562.558 175.947Z"
                                            fill="white"
                                        />
                                    </svg>
                                </div>
                                <span>Budgie</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                The privacy-first expense tracker that keeps your financial data exactly where it belongs—on your device.
                            </p>
                            <div className="flex gap-4">
                                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    <Github className="size-5" />
                                    <span className="sr-only">GitHub</span>
                                </Link>
                                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="size-5"
                                    >
                                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                                    </svg>
                                    <span className="sr-only">Twitter</span>
                                </Link>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold">App</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                                        Features
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#whitelist" className="text-muted-foreground hover:text-foreground transition-colors">
                                        Whitelist
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                        Download
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                        Roadmap
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold">Resources</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                        Documentation
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                        Privacy Guide
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                        Source Code
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                        Support
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                        Terms of Service
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                        License
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                        Security
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 sm:flex-row justify-between items-center border-t border-border/40 pt-8">
                        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Budgie. All rights reserved.</p>
                        <div className="flex gap-4">
                            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                Terms of Service
                            </Link>
                            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                Open Source License
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

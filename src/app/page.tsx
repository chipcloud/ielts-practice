'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Headphones, Pen, Mic, ArrowRight, GraduationCap } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <GraduationCap className="h-5 w-5" />
              <span className="font-medium">{t('home.badge')}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              {t('home.title')}
              <span className="block text-primary">{t('home.subtitle')}</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('home.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/exams">
                  {t('home.startButton')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">{t('home.modulesTitle')}</h2>
          <p className="text-lg text-muted-foreground">
            {t('home.modulesSubtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center mb-4">
                <Headphones className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>{t('home.listeningTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('home.listeningDesc')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>{t('home.readingTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('home.readingDesc')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center mb-4">
                <Pen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>{t('home.writingTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('home.writingDesc')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center mb-4">
                <Mic className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>{t('home.speakingTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('home.speakingDesc')}
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('home.ctaTitle')}</h2>
          <p className="text-lg mb-8 opacity-90">
            {t('home.ctaDesc')}
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link href="/exams">{t('home.ctaButton')}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

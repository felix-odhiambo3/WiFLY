import Image from 'next/image';
import CaptivePortal from '@/components/captive-portal/CaptivePortal';
import { placeholderImages } from '@/lib/placeholder-images';
import { Suspense } from 'react';

export default function Home() {
  const heroImage = placeholderImages.find((img) => img.id === 'wifi-hero');

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            data-ai-hint={heroImage.imageHint}
            priority
          />
        )}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      </div>

      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <CaptivePortal />
      </Suspense>
    </main>
  );
}

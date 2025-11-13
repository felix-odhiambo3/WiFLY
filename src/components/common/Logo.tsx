import { Wifi } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2 text-primary">
      <Wifi className="h-8 w-8" />
      <span className="text-3xl font-bold font-headline text-foreground">
        WiFly
      </span>
    </div>
  );
}

import {
  Sun,
  Sunrise,
  Cloud,
  CloudRain,
  CloudFog,
  type LucideIcon,
} from 'lucide-react';
import type { WeatherClass } from '@/types/weather';

const ICON_MAP: Record<WeatherClass, LucideIcon> = {
  cloudy: Cloud,
  foggy: CloudFog,
  rainy: CloudRain,
  shine: Sun,
  sunrise: Sunrise,
};

export function WeatherIcon({
  condition,
  className,
}: {
  condition: WeatherClass;
  className?: string;
}) {
  const Icon = ICON_MAP[condition];
  return <Icon className={className} aria-hidden="true" />;
}

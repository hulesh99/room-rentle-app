import {
  AirVent,
  ArrowUpDown,
  Car,
  CheckCircle2,
  Flame,
  Refrigerator,
  ShieldCheck,
  Sparkles,
  Sun,
  Tv,
  WashingMachine,
  Wifi,
  Zap,
} from 'lucide-react';

export const AMENITY_ICONS = {
  WIFI: Wifi,
  AC: AirVent,
  PARKING: Car,
  WASHING_MACHINE: WashingMachine,
  REFRIGERATOR: Refrigerator,
  TV: Tv,
  GEYSER: Flame,
  POWER_BACKUP: Zap,
  HOUSEKEEPING: Sparkles,
  BALCONY: Sun,
  SECURITY: ShieldCheck,
  LIFT: ArrowUpDown,
};

export const getAmenityIcon = (amenity) => AMENITY_ICONS[amenity] || CheckCircle2;

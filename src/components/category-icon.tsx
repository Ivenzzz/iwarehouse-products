import {
  Backpack,
  BatteryCharging,
  Bike,
  Cable,
  Camera,
  Gamepad2,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  type LucideIcon,
  Monitor,
  Package,
  Printer,
  Router,
  Smartphone,
  Tablet,
  Tv,
  Watch,
} from "lucide-react";
import { createElement } from "react";

/**
 * Category names come from the ERP and are not a fixed enum, so match on
 * keywords rather than exact values. First match wins — order matters where
 * a name could hit two rules ("gaming keyboard" should read as gaming).
 */
const RULES: Array<[RegExp, LucideIcon]> = [
  [/gaming|console|playstation|xbox|nintendo/i, Gamepad2],
  [/camera|drone|photograph|action cam/i, Camera],
  [/bag|travel|luggage|backpack|lifestyle/i, Backpack],
  [/mobility|scooter|bicycle|\bbike\b|\bev\b/i, Bike],
  [/laptop|computer|office|desktop|\bpc\b/i, Laptop],
  [/phone|mobile|smartphone|handset/i, Smartphone],
  [/tablet|ipad/i, Tablet],
  [/audio|headphone|earphone|speaker|sound/i, Headphones],
  [/watch|wearable|fitness band/i, Watch],
  [/monitor|display/i, Monitor],
  [/\btv\b|television/i, Tv],
  [/print|scanner|toner/i, Printer],
  [/network|router|wifi|modem/i, Router],
  [/storage|drive|\bssd\b|\bhdd\b|memory/i, HardDrive],
  [/keyboard|mouse|peripheral/i, Keyboard],
  [/power|battery|charger|adapter/i, BatteryCharging],
  [/accessor|cable|connectivity/i, Cable],
];

export function categoryIcon(name: string): LucideIcon {
  return RULES.find(([pattern]) => pattern.test(name))?.[1] ?? Package;
}

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  // createElement rather than <Icon />: the icon is looked up from the static
  // table above, but a capitalised local reads to the compiler lint as a
  // component defined during render.
  return createElement(categoryIcon(name), { className, "aria-hidden": true });
}

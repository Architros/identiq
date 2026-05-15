import type { IconSvgElement } from "@hugeicons/react";
import {
  Home01Icon,
  Image01Icon,
  BulbIcon,
  Upload01Icon,
  PaintBoardIcon,
  Message01Icon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";

export type NavItem = {
  label: string;
  href: string;
  icon: IconSvgElement;
  isNew?: boolean;
  disabled?: boolean;
};

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/", icon: Home01Icon },
  { label: "Images", href: "/images", icon: Image01Icon },
  { label: "Ideas", href: "/ideas", icon: BulbIcon },
];

export const secondaryNav: NavItem[] = [
  { label: "Uploads", href: "#", icon: Upload01Icon, disabled: true },
  { label: "Brand Details", href: "#", icon: PaintBoardIcon, disabled: true },
];

export const bottomNav: NavItem[] = [
  { label: "Feedback", href: "#", icon: Message01Icon, disabled: true },
  { label: "Help", href: "#", icon: HelpCircleIcon, disabled: true },
];

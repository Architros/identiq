import type { IconSvgElement } from "@hugeicons/react";
import {
  Home01Icon,
  Image01Icon,
  BulbIcon,
  LayoutGridIcon,
  PaintBoardIcon,
  Message01Icon,
  HelpCircleIcon,
  CreditCardIcon,
} from "@hugeicons/core-free-icons";

export type NavItem = {
  label: string;
  href: string;
  icon: IconSvgElement;
  isNew?: boolean;
  disabled?: boolean;
  /** Opens an in-app modal instead of navigating away. */
  supportAction?: "help" | "feedback";
};

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/", icon: Home01Icon },
  { label: "Brand assets", href: "/images", icon: Image01Icon },
  { label: "Studio", href: "/ideas", icon: BulbIcon },
];

export const secondaryNav: NavItem[] = [
  { label: "Library", href: "/library", icon: LayoutGridIcon },
  {
    label: "Brand Details",
    href: "/brands/current",
    icon: PaintBoardIcon,
    disabled: false,
  },
];

export const bottomNav: NavItem[] = [
  { label: "Billing", href: "/billing", icon: CreditCardIcon },
  { label: "Feedback", href: "#", icon: Message01Icon, supportAction: "feedback" },
  { label: "Help", href: "#", icon: HelpCircleIcon, supportAction: "help" },
];

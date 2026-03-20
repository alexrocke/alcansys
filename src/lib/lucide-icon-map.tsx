import {
  Zap, FolderKanban, TrendingUp, MessageCircle,
  Users, BarChart3, Sparkles, Settings, Star,
  Shield, Globe, Rocket, Heart, Mail, Phone,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Zap, FolderKanban, TrendingUp, MessageCircle,
  Users, BarChart3, Sparkles, Settings, Star,
  Shield, Globe, Rocket, Heart, Mail, Phone,
};

export function getLucideIcon(name: string): LucideIcon {
  return iconMap[name] || Sparkles;
}

export const availableIcons = Object.keys(iconMap);

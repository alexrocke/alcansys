import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { landingDefaults } from "@/lib/landingContent";

export interface LandingSectionRow {
  id: string;
  section: string;
  config: Record<string, any>;
  order: number;
  visible: boolean;
}

export interface LandingContent {
  get: (section: string) => Record<string, any>;
  isVisible: (section: string) => boolean;
  isLoading: boolean;
}

export function useLandingContent(): LandingContent {
  const { data, isLoading } = useQuery({
    queryKey: ["landing-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("landing_config").select("*").order("order");
      if (error) throw error;
      return data as unknown as LandingSectionRow[];
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const bySection = new Map<string, LandingSectionRow>();
  (data || []).forEach((row) => bySection.set(row.section, row));

  return {
    get: (section) => ({ ...(landingDefaults[section] || {}), ...(bySection.get(section)?.config || {}) }),
    isVisible: (section) => bySection.get(section)?.visible ?? true,
    isLoading,
  };
}

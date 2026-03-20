import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LandingSection {
  id: string;
  section: string;
  config: Record<string, any>;
  order: number;
  visible: boolean;
}

export function useLandingConfig() {
  return useQuery({
    queryKey: ["landing-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_config")
        .select("*")
        .order("order");
      if (error) throw error;
      return data as LandingSection[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useLandingSection(section: string) {
  const { data, ...rest } = useLandingConfig();
  const sectionData = data?.find((s) => s.section === section);
  return { data: sectionData, ...rest };
}

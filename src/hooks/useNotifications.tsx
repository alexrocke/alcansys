import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface Notification {
  id: string;
  tipo: "critico" | "importante" | "informativo";
  mensagem: string;
  resolvido: boolean;
  created_at: string;
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
  });

  // Calculate unread count
  useEffect(() => {
    const unread = notifications.filter((n) => !n.resolvido).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Listen to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel("alerts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alerts",
        },
        (payload) => {
          console.log("Alert change received:", payload);
          // Invalidate and refetch notifications
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("alerts")
      .update({ resolvido: true })
      .eq("id", id);

    if (error) {
      console.error("Error marking notification as read:", error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from("alerts")
      .update({ resolvido: true })
      .eq("resolvido", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  };
}

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setFavorites(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("favorites").select("tutor_id").eq("student_id", user.id);
    setFavorites(new Set((data || []).map((f) => f.tutor_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = useCallback(async (tutorId: string) => {
    if (!user) return false;
    const isFav = favorites.has(tutorId);
    if (isFav) {
      await supabase.from("favorites").delete().eq("student_id", user.id).eq("tutor_id", tutorId);
      setFavorites((prev) => { const n = new Set(prev); n.delete(tutorId); return n; });
      return false;
    }
    await supabase.from("favorites").insert({ student_id: user.id, tutor_id: tutorId });
    setFavorites((prev) => new Set(prev).add(tutorId));
    return true;
  }, [user, favorites]);

  return { favorites, loading, toggle, refresh, isFavorite: (id: string) => favorites.has(id) };
}
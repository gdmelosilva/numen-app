import { useEffect, useState } from "react";

// Retorna as horas consumidas por um usuário em um projeto
export function useUserProjectHours(userId?: string, projectId?: string) {
  const [hours, setHours] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !projectId) {
      setHours(null);
      return;
    }
    setLoading(true);
    fetch(`/api/ticket-hours?user_id=${userId}&project_id=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const totalMinutes = data.reduce((sum, item) => sum + (item.minutes || 0), 0);
          setHours(totalMinutes / 60);
        } else {
          setHours(0);
        }
      })
      .catch(() => setHours(null))
      .finally(() => setLoading(false));
  }, [userId, projectId]);

  return { hours, loading };
}

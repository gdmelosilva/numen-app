import { useEffect, useState } from "react";

export function useMessageHours(messageId?: string) {
  const [hours, setHours] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!messageId) {
      setHours(null);
      return;
    }
    setLoading(true);
    fetch(`/api/ticket-hours?message_id=${messageId}`)
      .then((res) => res.json())
      .then((data) => {
        // Suporta múltiplos apontamentos, soma todos os minutos
        if (Array.isArray(data) && data.length > 0) {
          const totalMinutes = data.reduce((sum, item) => sum + (item.minutes || 0), 0);
          setHours(totalMinutes / 60);
        } else {
          setHours(null);
        }
      })
      .catch(() => setHours(null))
      .finally(() => setLoading(false));
  }, [messageId]);

  return { hours, loading };
}

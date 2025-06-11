import { useEffect, useState } from "react";

export function useSystemMessageHours(systemMsgId?: string, ticketId?: string) {
  const [hours, setHours] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!systemMsgId || !ticketId) {
      setHours(null);
      return;
    }
    setLoading(true);
    // 1. Busca a mensagem original pelo campo msg_ref_id, filtrando também por ticket_id
    fetch(`/api/messages?msg_ref_id=${systemMsgId}&ticket_id=${ticketId}`)
      .then((res) => res.json())
      .then(async (data) => {
        if (Array.isArray(data) && data.length > 0) {
          const originalMsg = data[0];
          if (originalMsg && originalMsg.id) {
            // 2. Busca as horas usando o id da mensagem original
            const hoursRes = await fetch(`/api/ticket-hours?message_id=${originalMsg.id}`);
            const hoursData = await hoursRes.json();
            if (Array.isArray(hoursData) && hoursData.length > 0) {
              const totalMinutes = hoursData.reduce((sum, item) => sum + (item.minutes || 0), 0);
              setHours(totalMinutes / 60);
            } else {
              setHours(null);
            }
          } else {
            setHours(null);
          }
        } else {
          setHours(null);
        }
      })
      .catch(() => setHours(null))
      .finally(() => setLoading(false));
  }, [systemMsgId, ticketId]);

  return { hours, loading };
}

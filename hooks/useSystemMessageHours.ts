import { useEffect, useState } from "react";

export function useSystemMessageHours(systemMsgId?: string, ticketId?: string) {
  const [hours, setHours] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("[useSystemMessageHours] systemMsgId:", systemMsgId, "ticketId:", ticketId);
    if (!systemMsgId || !ticketId) {
      setHours(null);
      return;
    }
    setLoading(true);
    const url = `/api/messages?ref_msg_id=${systemMsgId}&ticket_id=${ticketId}`;
    console.log("[useSystemMessageHours] Fetching:", url);
    fetch(url)
      .then((res) => res.json())
      .then(async (data) => {
        console.log("[useSystemMessageHours] /api/messages result:", data);
        if (Array.isArray(data) && data.length > 0) {
          const originalMsg = data[0];
          if (originalMsg && originalMsg.id) {
            const hoursUrl = `/api/ticket-hours?message_id=${originalMsg.id}`;
            console.log("[useSystemMessageHours] Fetching:", hoursUrl);
            const hoursRes = await fetch(hoursUrl);
            const hoursData = await hoursRes.json();
            console.log("[useSystemMessageHours] /api/ticket-hours result:", hoursData);
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
      .catch((err) => {
        console.error("[useSystemMessageHours] Error: ", err);
        setHours(null);
      })
      .finally(() => setLoading(false));
  }, [systemMsgId, ticketId]);

  return { hours, loading };
}

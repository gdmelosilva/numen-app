import { useEffect, useState } from "react";

export interface TicketHour {
  id: string;
  appoint_date: string;
  minutes: number;
  is_approved: boolean;
}

export interface TicketHourGrouped {
  appoint_date: string;
  total_minutes: number;
  is_approved: boolean;
  ids: string[];
}

export function useTicketHoursManagement() {
  const [data, setData] = useState<TicketHourGrouped[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/ticket-hours")
      .then((res) => res.json())
      .then((rows: TicketHour[]) => {
        // Agrupa por appoint_date e is_approved
        const grouped: Record<string, TicketHourGrouped> = {};
        rows.forEach((row) => {
          const key = `${row.appoint_date}|${row.is_approved}`;
          if (!grouped[key]) {
            grouped[key] = {
              appoint_date: row.appoint_date,
              total_minutes: 0,
              is_approved: row.is_approved,
              ids: [],
            };
          }
          grouped[key].total_minutes += row.minutes || 0;
          grouped[key].ids.push(row.id);
        });
        setData(Object.values(grouped));
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

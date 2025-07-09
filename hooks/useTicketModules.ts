import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

const supabase = await createClient();

export async function getTicketModules() {
  const { data, error } = await supabase
    .from('ticket_modules')
    .select('id, name');
  if (error) {
    return [];
  }
  return data || [];
}

export function useTicketModules() {
  const [modules, setModules] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/ticket-modules')
      .then(res => res.ok ? res.json() : Promise.reject('Erro ao buscar módulos'))
      .then(data => {
        if (isMounted) setModules(Array.isArray(data) ? data : data?.data || []);
      })
      .catch(() => { if (isMounted) setModules([]); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  return { modules, loading };
}

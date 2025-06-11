import { useState, useEffect } from 'react';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import type { User } from '@/types/users';

export default function ProjectUsersTab({ projectId }: { projectId: string }) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`/api/smartbuild/users?project_id=${projectId}`)
            .then(res => res.ok ? res.json() : Promise.reject('Erro ao buscar usuários'))
            .then(data => setUsers(Array.isArray(data) ? data : data?.data || []))
            .catch(err => setError(typeof err === 'string' ? err : 'Erro ao buscar usuários'))
            .finally(() => setLoading(false));
    }, [projectId]);

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Carregando usuários...</p>
            </div>
        );
    }
    if (error) {
        return <div className="text-destructive text-center py-8">{error}</div>;
    }
    if (!users.length) {
        return <div className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado para este projeto</div>;
    }

    return (
        <DataTable columns={columns} data={users} />
    );
}

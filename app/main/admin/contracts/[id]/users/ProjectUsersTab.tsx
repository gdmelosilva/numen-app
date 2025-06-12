import { useState, useEffect } from 'react';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import type { User } from '@/types/users';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function ProjectUsersTab({ projectId }: { projectId: string }) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [partnerUsers, setPartnerUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const { user: currentUser } = useCurrentUser();

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`/api/smartbuild/users?project_id=${projectId}`)
            .then(res => res.ok ? res.json() : Promise.reject('Erro ao buscar usuários'))
            .then(data => setUsers(Array.isArray(data) ? data : data?.data || []))
            .catch(err => setError(typeof err === 'string' ? err : 'Erro ao buscar usuários'))
            .finally(() => setLoading(false));
    }, [projectId]);

    // Busca usuários do parceiro que não estão no projeto
    const fetchPartnerUsers = async () => {
        if (!currentUser?.partner_id) return;
        const res = await fetch(`/api/smartbuild/users?partner_id=${currentUser.partner_id}`);
        const allPartnerUsers = await res.json();
        // Filtra para mostrar apenas os que não estão no projeto
        const notInProject = (Array.isArray(allPartnerUsers) ? allPartnerUsers : allPartnerUsers?.data || []).filter((u: User) => !users.some(projU => projU.id === u.id));
        setPartnerUsers(notInProject);
    };

    const handleOpenDialog = async () => {
        await fetchPartnerUsers();
        setShowDialog(true);
    };

    const handleLinkUser = async () => {
        if (!selectedUserId) return;
        // Chame o endpoint para vincular o usuário ao projeto
        await fetch('/api/project-resources/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: projectId, user_id: selectedUserId })
        });
        setShowDialog(false);
        setSelectedUserId(null);
        // Atualiza lista de usuários do projeto
        setLoading(true);
        fetch(`/api/smartbuild/users?project_id=${projectId}`)
            .then(res => res.ok ? res.json() : Promise.reject('Erro ao buscar usuários'))
            .then(data => setUsers(Array.isArray(data) ? data : data?.data || []))
            .catch(err => setError(typeof err === 'string' ? err : 'Erro ao buscar usuários'))
            .finally(() => setLoading(false));
    };

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
    return (
        <div>
            <div className="flex justify-end mb-4">
                <Button onClick={handleOpenDialog}>Vincular Usuário</Button>
            </div>
            <DataTable columns={columns} data={users} />
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Vincular Usuário ao Projeto</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-64 overflow-y-auto">
                        {partnerUsers.length === 0 ? (
                            <div className="text-muted-foreground text-center py-4">Nenhum usuário disponível para vincular.</div>
                        ) : (
                            <ul>
                                {partnerUsers.map(u => (
                                    <li key={u.id} className="flex items-center gap-2 py-2">
                                        <input
                                            type="radio"
                                            name="select-user"
                                            value={u.id}
                                            checked={selectedUserId === u.id}
                                            onChange={() => setSelectedUserId(u.id)}
                                        />
                                        <span>{u.first_name} {u.last_name} ({u.email})</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={handleLinkUser} disabled={!selectedUserId}>Vincular</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


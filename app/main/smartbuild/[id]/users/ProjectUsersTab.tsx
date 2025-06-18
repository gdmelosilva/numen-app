import { useState, useEffect } from 'react';
import { columns as columnsWithProjectId } from './columns';
import { DataTable } from '@/components/ui/data-table';
import type { User } from '@/types/users';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useTicketModules } from '@/hooks/useTicketModules';

export default function ProjectUsersTab({ projectId, isClosed }: { projectId: string; isClosed?: boolean }) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [partnerUsers, setPartnerUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [maxHours, setMaxHours] = useState<number | ''>('');
    const [userFunctional, setUserFunctional] = useState<string>('');
    const { user: currentUser } = useCurrentUser();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const USERS_PER_PAGE = 5;
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const { modules: ticketModules, loading: loadingModules } = useTicketModules();

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`/api/smartcare/users?project_id=${projectId}`)
            .then(res => res.ok ? res.json() : Promise.reject('Erro ao buscar usuários'))
            .then((data) => {
                // Usa diretamente os dados retornados pela API
                const usersData: User[] = Array.isArray(data) ? data : data?.data || [];
                setUsers(usersData);
            })
            .catch(err => setError(typeof err === 'string' ? err : 'Erro ao buscar usuários'))
            .finally(() => setLoading(false));
    }, [projectId]);

    // Busca usuários do parceiro que não estão no projeto, considerando regras de is_client
    const fetchPartnerUsers = async () => {
        if (!currentUser?.partner_id) return;
        // Busca todos os usuários is_client = false
        const resNonClients = await fetch(`/api/smartbuild/users?is_client=false`);
        const nonClients = await resNonClients.json();
        // Busca todos os usuários is_client = true vinculados ao parceiro
        const resClients = await fetch(`/api/smartbuild/users?is_client=true&partner_id=${currentUser.partner_id}`);
        const clients = await resClients.json();
        // Junta os dois arrays
        const allPartnerUsers = [
            ...(Array.isArray(nonClients) ? nonClients : nonClients?.data || []),
            ...(Array.isArray(clients) ? clients : clients?.data || [])
        ];
        // Remove duplicados por id
        const uniqueUsers = allPartnerUsers.filter((u, idx, arr) => arr.findIndex(x => x.id === u.id) === idx);
        // Filtra para mostrar apenas os que não estão no projeto
        const notInProject = uniqueUsers.filter((u) => !users.some(projU => projU.id === u.id));
        setPartnerUsers(notInProject);
    };

    const handleOpenDialog = async () => {
        setFetchingUsers(true);
        await fetchPartnerUsers();
        setShowDialog(true);
        setFetchingUsers(false);
    };

    const handleLinkUser = async () => {
        if (!selectedUserId || !maxHours || userFunctional === '') return;
        await fetch('/api/project-resources/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_id: projectId,
                user_id: selectedUserId,
                max_hours: Number(maxHours),
                user_functional: userFunctional,
            })
        });
        setShowDialog(false);
        setSelectedUserId(null);
        setMaxHours('');
        setUserFunctional('');
        setLoading(true);
        fetch(`/api/smartcare/users?project_id=${projectId}`)
            .then(res => res.ok ? res.json() : Promise.reject('Erro ao buscar usuários'))
            .then((data) => {
                const usersData: User[] = Array.isArray(data) ? data : data?.data || [];
                setUsers(usersData);
            })
            .catch(err => setError(typeof err === 'string' ? err : 'Erro ao buscar usuários'))
            .finally(() => setLoading(false));
    };

    // Preenche horas consumidas para cada usuário
    const [usersWithHours, setUsersWithHours] = useState<(User & { horas_consumidas: number })[]>([]);
    useEffect(() => {
        if (!users.length) return;
        let isMounted = true;
        Promise.all(users.map(async (u) => {
            const res = await fetch(`/api/ticket-hours?user_id=${u.id}&project_id=${projectId}`);
            const data = await res.json();
            let horas_consumidas = 0;
            if (Array.isArray(data) && data.length > 0) {
                const totalMinutes = data.reduce((sum, item) => sum + (item.minutes || 0), 0);
                horas_consumidas = +(totalMinutes / 60).toFixed(2);
            }
            return { ...u, horas_consumidas };
        })).then(arr => { if (isMounted) setUsersWithHours(arr); });
        return () => { isMounted = false; };
    }, [users, projectId]);

    const filteredUsers = partnerUsers.filter((u) => {
        const q = search.toLowerCase();
        return (
            u.first_name.toLowerCase().includes(q) ||
            u.last_name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        );
    });
    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice(
        page * USERS_PER_PAGE,
        (page + 1) * USERS_PER_PAGE
    );

    function getRoleLabel(role: number | null, isClient: boolean) {
        if (isClient) return 'Key-User';
        if (role === 1) return 'Administrador';
        if (role === 2) return 'Gerente';
        if (role === 3) return 'Funcional';
        return 'Usuário';
    }

    useEffect(() => { setPage(0); }, [search, partnerUsers]);

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <div className="flex items-center gap-2 mt-4">
                    <h2 className="flex items-center text-lg font-semibold">
                        <Users className="w-4 h-4 mr-2" /> Usuários Vinculados
                    </h2>
                </div>
                <Button onClick={handleOpenDialog} className="whitespace-nowrap mt-4" disabled={isClosed}>Vincular Usuário</Button>
            </div>
            <DataTable columns={columnsWithProjectId(projectId, isClosed)} data={usersWithHours.length ? usersWithHours : users} />
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="w-[750px] max-w-[750px] mx-auto">
                    <DialogHeader>
                        <DialogTitle>Vincular Usuário ao Projeto</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            await handleLinkUser();
                        }}
                    >
                        <div className="space-y-4 py-2">
                            <div>
                                <label className="block text-sm font-medium mb-1" htmlFor="search-user">Buscar Usuário</label>
                                <Input
                                    id="search-user"
                                    type="text"
                                    placeholder="Buscar por nome ou email..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    disabled={fetchingUsers}
                                />
                            </div>
                            <div>
                                <div className="max-h-60 overflow-y-auto border rounded p-2">
                                    {fetchingUsers ? (
                                        <div className="flex items-center justify-center py-6">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : filteredUsers.length === 0 ? (
                                        <div className="text-muted-foreground text-center py-4">Nenhum usuário disponível para vincular.</div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-12 gap-2 px-3 pb-1 text-xs font-semibold text-muted-foreground">
                                                <span className="col-span-4">Nome</span>
                                                <span className="col-span-2">Tipo</span>
                                                <span className="col-span-2">Cargo</span>
                                                <span className="col-span-4">Email</span>
                                            </div>
                                            {paginatedUsers.map(u => (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    className={`w-full text-left px-3 py-2 rounded hover:bg-secondary ${selectedUserId === u.id ? 'border-2 border-primary' : ''}`}
                                                    onClick={() => setSelectedUserId(u.id)}
                                                    disabled={fetchingUsers}
                                                >
                                                    <div className="grid grid-cols-12 items-center gap-2">
                                                        <span className="col-span-4 font-medium truncate">{u.first_name} {u.last_name}</span>
                                                        <span className="col-span-2">
                                                            <Badge variant={u.is_client ? 'accent' : 'secondary'}>
                                                                {u.is_client ? 'Cliente' : 'Administrativo'}
                                                            </Badge>
                                                        </span>
                                                        <span className="col-span-2">
                                                            <Badge variant={u.is_client ? 'outline' : 'default'}>
                                                                {getRoleLabel(u.role, u.is_client)}
                                                            </Badge>
                                                        </span>
                                                        <span className="col-span-4 block text-xs text-muted-foreground truncate">{u.email}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                                {filteredUsers.length > 0 && (
                                    <div className="flex justify-between items-center px-3 pb-2 pt-2">
                                        <span className="text-xs text-muted-foreground">
                                            Página {totalPages === 0 ? 0 : page + 1} de {totalPages}
                                        </span>
                                        <div className="space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                                disabled={page === 0}
                                            >Anterior</Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                                disabled={page >= totalPages - 1}
                                            >Próxima</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label htmlFor="max_hours" className="block text-sm font-medium mb-1">Horas Máximas de Alocação</label>
                                <Input
                                    id="max_hours"
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={maxHours}
                                    onChange={e => setMaxHours(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="Ex: 40"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="user_functional" className="block text-sm font-medium mb-1">Módulo do Recurso</label>
                                <Select
                                    value={userFunctional}
                                    onValueChange={setUserFunctional}
                                    disabled={loadingModules}
                                >
                                    <SelectTrigger id="user_functional" className="w-full">
                                        <SelectValue
                                            placeholder={loadingModules ? 'Carregando...' : 'Selecione o módulo'}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ticketModules.map((mod) => (
                                            <SelectItem key={mod.id} value={mod.id}>{mod.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="submit" disabled={!selectedUserId || !maxHours || userFunctional === '' || isClosed}>Vincular</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}


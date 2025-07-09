import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useUsersForFilter } from '@/hooks/useUsersForFilter';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UserFilterDialogProps {
  onApplyFilter: (userId: string | null) => void;
  selectedUserId: string | null;
  trigger: React.ReactNode;
}

export const UserFilterDialog: React.FC<UserFilterDialogProps> = ({
  onApplyFilter,
  selectedUserId,
  trigger,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelectedUserId, setTempSelectedUserId] = useState<string | null>(selectedUserId);
  const { users, loading, error } = useUsersForFilter();

  const handleApplyFilter = () => {
    onApplyFilter(tempSelectedUserId);
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    setTempSelectedUserId(null);
    onApplyFilter(null);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSelectedUserId(selectedUserId);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar por Usuário</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {loading && (
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          )}
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          {!loading && !error && (
            <div className="grid gap-2">
              <label htmlFor="user-select" className="text-sm font-medium">
                Selecionar Usuário:
              </label>
              <Select
                value={tempSelectedUserId || ''}
                onValueChange={(value) => setTempSelectedUserId(value || null)}
              >
                <SelectTrigger id="user-select" className='w-full max-w-full'>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={handleClearFilter}>
            Limpar Filtro
          </Button>
          <Button onClick={handleApplyFilter}>
            Aplicar Filtro
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

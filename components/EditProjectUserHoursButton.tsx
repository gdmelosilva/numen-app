import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil } from "lucide-react";

interface EditProjectUserHoursButtonProps {
  userId: string;
  projectId: string;
  projectResourceId: number;
  currentHours: number;
  onUpdated?: () => void;
  disabled?: boolean;
}

export function EditProjectUserHoursButton({ userId, projectId, currentHours, onUpdated, disabled }: EditProjectUserHoursButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hours, setHours] = useState(currentHours);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/project-resources/update-hours`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, project_id: projectId, max_hours: hours })
      });
      if (!res.ok) throw new Error("Erro ao atualizar horas alocadas");
      setOpen(false);
      if (onUpdated) onUpdated();
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || "Erro desconhecido");
      } else {
        setError("Erro desconhecido");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button size="icon" variant="outline" title="Editar horas alocadas" onClick={() => setOpen(true)} disabled={loading || disabled}>
        <Pencil className="w-4 h-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar horas alocadas</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              type="number"
              min={0}
              step={0.5}
              value={hours}
              onChange={e => setHours(Number(e.target.value))}
              disabled={loading || disabled}
            />
            {error && <div className="text-destructive text-xs mt-2">{error}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading || disabled}>Cancelar</Button>
            <Button variant="secondary" onClick={handleUpdate} disabled={loading || hours < 0 || disabled}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

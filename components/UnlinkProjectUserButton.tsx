import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Link2Off } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface UnlinkProjectUserButtonProps {
  userId: string;
  projectId: string;
  projectResourceId: number;
  onUnlinked?: () => void;
  consumedHours: number;
  disabled?: boolean;
}

export function UnlinkProjectUserButton({ userId, projectId, projectResourceId, onUnlinked, consumedHours, disabled }: UnlinkProjectUserButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleUnlink = async () => {
    setLoading(true);
    try {
      if (consumedHours > 0) {
        const res = await fetch(`/api/project-resources/update-hours`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, project_id: projectId, max_hours: consumedHours })
        });
        if (!res.ok) throw new Error("Erro ao atualizar horas alocadas");
      } else {
        const res = await fetch(`/api/project-resources/unlink`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: projectResourceId })
        });
        if (!res.ok) throw new Error("Erro ao desvincular usuário");
      }
      setOpen(false);
      if (onUnlinked) onUnlinked();
    } catch (e: unknown) {
      console.log("Erro ao desvincular usuário:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button size="icon" variant="destructive" title="Desvincular do Projeto" onClick={() => setOpen(true)} disabled={loading || disabled}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2Off className="w-5 h-5" />}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {consumedHours > 0
                ? "Deseja ajustar as horas do usuário no projeto?"
                : "Desvincular recurso do projeto?"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            {consumedHours > 0
              ? "O usuário já possui horas consumidas neste projeto. Ao confirmar, as horas alocadas serão ajustadas para o total consumido."
              : "Tem certeza que deseja desvincular este recurso do projeto? Esta ação não poderá ser desfeita."}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading || disabled}>Cancelar</Button>
            <Button variant="destructive" onClick={handleUnlink} disabled={loading || disabled}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (consumedHours > 0 ? "Ajustar Horas" : "Desvincular")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

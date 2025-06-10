import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Link2Off } from "lucide-react";
import React, { useState } from "react";

interface UnlinkUserButtonProps {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  partnerId: string;
  onUnlinked?: () => void;
}

export const UnlinkUserButton: React.FC<UnlinkUserButtonProps> = ({
  user,
  partnerId,
  onUnlinked,
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlink = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/user-partner/unlink-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, partnerId }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao desvincular usuário");
      }
      setShowDialog(false);
      if (onUnlinked) onUnlinked();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="icon"
        onClick={() => setShowDialog(true)}
        title="Desvincular usuário"
      >
        <Link2Off className="w-4 h-4" />
      </Button>
      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          if (!loading) setShowDialog(open);
        }}
      >
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Desvincular Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desvincular o usuário
              <strong className="text-muted-foreground">
                {" "} {user.first_name} {user.last_name} {" "}
              </strong>
              deste parceiro?
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="text-destructive text-sm pb-2">{error}</div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnlink}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Desvincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

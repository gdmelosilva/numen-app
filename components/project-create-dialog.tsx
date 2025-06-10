import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { CreateProjectForm } from "@/components/create-project-form";

interface ProjectCreateDialogProps {
  onSuccess?: () => void;
}

export function ProjectCreateDialog({ onSuccess }: ProjectCreateDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Novo Projeto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogTitle className="sr-only">Criar Novo Projeto</DialogTitle>
        <CreateProjectForm onCreate={() => {
          setOpen(false);
          onSuccess?.();
        }} />
      </DialogContent>
    </Dialog>
  );
}
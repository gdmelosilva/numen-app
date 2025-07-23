import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TicketHourData {
  minutes: number;
  appointDate: string;
  appointStart: string;
  appointEnd: string;
}

interface TicketHourDialogButtonProps {
  onSave: (data: TicketHourData) => void;
  initialData?: TicketHourData | null;
  disabled?: boolean;
}

const TicketHourDialogButton: React.FC<TicketHourDialogButtonProps> = ({ onSave, initialData, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [appointDate, setAppointDate] = useState(initialData?.appointDate || "");
  const [appointStart, setAppointStart] = useState(initialData?.appointStart || "");
  const [appointEnd, setAppointEnd] = useState(initialData?.appointEnd || "");

  function getMinutesBetween(start: string, end: string) {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    return Math.max(0, endMinutes - startMinutes);
  }

  function formatMinutesToHours(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h${m > 0 ? ` ${m}min` : ""}`;
  }

  function handleSave() {
    if (!appointStart || !appointEnd) return;
    const minutes = getMinutesBetween(appointStart, appointEnd);
    if (minutes <= 0) return;
    onSave({
      minutes,
      appointDate,
      appointStart,
      appointEnd,
    });
    setOpen(false);
  }

  const minutes = getMinutesBetween(appointStart, appointEnd);

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} disabled={disabled}>
        Apontar Horas
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apontamento de Horas</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data do Apontamento</label>
              <Input
                type="date"
                value={appointDate}
                onChange={e => setAppointDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora Inicial</label>
              <Input
                type="time"
                value={appointStart}
                onChange={e => setAppointStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora Final</label>
              <Input
                type="time"
                value={appointEnd}
                onChange={e => setAppointEnd(e.target.value)}
              />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">
                Total apontado: <span className="font-semibold">{formatMinutesToHours(minutes)}</span>
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleSave}>
              Salvar Apontamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export type { TicketHourData };
export default TicketHourDialogButton;

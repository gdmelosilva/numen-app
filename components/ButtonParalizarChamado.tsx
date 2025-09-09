import { Button } from "./ui/button";
import { Pause } from "lucide-react";

type Props = { onClick?: () => void; disabled?: boolean; loading?: boolean };

export default function ParalizarChamadoButton({ onClick, disabled, loading }: Props) {
  return (
    <Button size="sm" variant="destructive" onClick={onClick} disabled={disabled}>
      <Pause size={14} className="mr-1" /> {loading ? "Paralisando..." : "Paralisar Chamado"}
    </Button>
  );
}
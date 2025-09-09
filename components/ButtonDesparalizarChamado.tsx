import { Button } from "./ui/button";
import { Pause } from "lucide-react";

type Props = { onClick?: () => void; disabled?: boolean; loading?: boolean };

export default function DesparalizarChamadoButton({ onClick, disabled, loading }: Props) {
  return (
    <Button size="lg" variant="colored1" onClick={onClick} disabled={disabled}>
      <Pause size={14} className="mr-1" /> {loading ? "Reativando..." : "Reativar Chamado"}
    </Button>
  );
}
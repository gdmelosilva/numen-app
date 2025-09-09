import { Button } from "./ui/button";
import { FileCheck2 } from "lucide-react";

type Props = { onClick?: () => void; disabled?: boolean; loading?: boolean };

export default function SolicitarEncerramentoButton({ onClick, disabled, loading }: Props) {
  return (
    <Button size="lg" variant="colored2" onClick={onClick} disabled={disabled}>
      <FileCheck2 size={14} className="mr-1" /> {loading ? "Solicitando..." : "Solicitar Encerramento"}
    </Button>
  );
}
import type { Contract } from "@/types/contracts";

interface ProjectDashboardTabProps {
  project: Contract;
}

export default function ProjectDashboardTab({ project }: ProjectDashboardTabProps) {
  return (
    <div className="p-8 text-center text-muted-foreground">
      {/* Conteúdo do dashboard do projeto aqui */}
      Dashboard do projeto (implementar)
    </div>
  );
}

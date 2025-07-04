"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonProps {
  onExport: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "colored1" | "colored2";
  className?: string;
  label?: string;
}

export default function ExportButton({ 
  onExport, 
  disabled = false, 
  variant = "outline", 
  className = "",
  label = "Exportar Excel" 
}: ExportButtonProps) {
  return (
    <Button
      variant={variant}
      onClick={onExport}
      disabled={disabled}
      className={className}
      aria-label="Exportar para Excel"
    >
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus } from "lucide-react";

interface WeeklyScheduleDisplayProps {
  onAddSla?: (dayName: string) => void;
  disabled?: boolean;
}

const WEEK_DAYS = [
  { name: "Domingo", color: "border-l-blue-500", active: false, start: "--:--", end: "--:--", weekdayId: 0 },
  { name: "Segunda-feira", color: "border-l-green-500", active: true, start: "08:00", end: "18:00", weekdayId: 1 },
  { name: "Terça-feira", color: "border-l-green-500", active: true, start: "08:00", end: "18:00", weekdayId: 2 },
  { name: "Quarta-feira", color: "border-l-green-500", active: true, start: "08:00", end: "18:00", weekdayId: 3 },
  { name: "Quinta-feira", color: "border-l-green-500", active: true, start: "08:00", end: "18:00", weekdayId: 4 },
  { name: "Sexta-feira", color: "border-l-green-500", active: true, start: "08:00", end: "18:00", weekdayId: 5 },
  { name: "Sábado", color: "border-l-blue-500", active: false, start: "--:--", end: "--:--", weekdayId: 6 },
];

export function WeeklyScheduleDisplay({ onAddSla, disabled = false }: WeeklyScheduleDisplayProps) {
  const handleDayClick = (day: string) => {
    // Apenas chama o callback - deixa o componente pai gerenciar o dialog
    onAddSla?.(day);
  };

  return (
    <TooltipProvider>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {WEEK_DAYS.map((day) => (
          <Card key={day.name} className={`border-l-4 ${day.color}`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-sm">{day.name}</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => handleDayClick(day.name)}
                      disabled={disabled}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configurar SLA</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div>Início: {day.start}</div>
                <div>Fim: {day.end}</div>
                <div className="pt-1">
                  <Badge 
                    variant={day.active ? "primary" : "outline"} 
                    className="text-xs"
                  >
                    {day.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
import React from 'react';
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { UserFilterDialog } from '@/components/UserFilterDialog'

interface TimesheetSidebarProps {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onAccept: () => void;
  onFilter: (userId: string | null) => void;
  onDownloadReport: () => void;
  lastUpdate: string;
  estimatedHours: number;
  launchedDays: number;
  workedHours: string;
  statusHours: string;
  selectedUserId?: string | null;
  showUserFilter?: boolean;
  isClient?: boolean;
}

const months = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export const TimesheetSidebar: React.FC<TimesheetSidebarProps> = ({
  year,
  month,
  onYearChange,
  onMonthChange,
  onFilter,
  onDownloadReport,
  lastUpdate,
  estimatedHours,
  launchedDays,
  workedHours,
  statusHours,
  selectedUserId,
  showUserFilter = false,
  isClient = false,
}) => {
  return (
    <aside className="w-80 p-4 flex flex-col gap-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow border-0">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="outline" onClick={onDownloadReport}>
          Baixar Relatório de Horas
        </Button>
        {showUserFilter ? (
          <UserFilterDialog
            onApplyFilter={onFilter}
            selectedUserId={selectedUserId || null}
            trigger={
              <Button variant="outline">
                Filtrar
              </Button>
            }
          />
        ) : (
          <Button variant="outline" onClick={() => onFilter(null)}>
            Filtrar
          </Button>
        )}
      </div>
      <Card className="p-3 flex flex-col items-center min-h-[200px]">
        <div className="flex items-center justify-between w-full mb-2">
          <Button variant="ghost" size="icon" onClick={() => onYearChange(year - 1)}>&lt;</Button>
          <span className="font-semibold text-lg">{year}</span>
          <Button variant="ghost" size="icon" onClick={() => onYearChange(year + 1)}>&gt;</Button>
        </div>
        <div className="w-full px-2">
          <Tabs value={String(month)} onValueChange={v => onMonthChange(Number(v))}>
            <TabsList className="grid grid-cols-4 w-full rounded-lg p- bg-white">
              {months.map((m, idx) => (
                <TabsTrigger key={m} value={String(idx)} className="py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                  {m}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </Card>
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Última atualização: {lastUpdate}
      </div>
      <CardContent className="flex flex-col gap-2 p-0">
        {!isClient && (
          <>
            <div className="flex justify-between text-sm py-2">
              <span>Horas Estimadas do mês</span>
              <span className="font-bold">{estimatedHours}</span>
            </div>
            <Separator />
          </>
        )}
        <div className="flex justify-between text-sm py-2">
          <span>Dias Lançados</span>
          <span className="font-bold">{launchedDays}</span>
        </div>
        <Separator />
        {!isClient && (
          <>
            <div className="flex justify-between text-sm py-2">
              <span>Horas Trabalhadas</span>
              <span className="font-bold">{workedHours}</span>
            </div>
            <Separator />
          </>
        )}
        <div className="flex justify-between text-sm py-2">
          <span>{isClient ? 'Estimativa de horas mensal' : 'Horas Aprovadas'}</span>
          <span className="font-bold">{statusHours}</span>
        </div>
      </CardContent>
        {/* <Button className="flex-1 max-h-14" onClick={onAccept}>
          Aceite de Fechamento
        </Button> */}
      {/* <Button variant="link" className="mt-2 text-xs text-center" style={{padding:0}}>
        Ver Resumo Semanal
      </Button> */}
    </aside>
  );
};

"use client"

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { usePartnerOptions } from '@/hooks/usePartnerOptions'
import { useProjectOptions } from '@/hooks/useProjectOptions'
import { useTicketOptions } from '@/hooks/useTicketOptions'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FormData {
  partnerId: string
  projectId: string
  ticketId: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  description: string
  includeWeekend: boolean
  includeSunday: boolean
  includeHoliday: boolean
}

const TimeSheetCreatePage = () => {
  const { user } = useCurrentUser()
  const router = useRouter()
  const { partners, loading: partnersLoading } = usePartnerOptions(user)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const { projects, loading: projectsLoading } = useProjectOptions({ partnerId: selectedPartnerId, user })
  const { tickets, loading: ticketsLoading } = useTicketOptions({ 
    projectId: selectedProjectId, 
    partnerId: selectedPartnerId,
    userId: user?.id
  })
  
  const [formData, setFormData] = useState<FormData>({
    partnerId: '',
    projectId: '',
    ticketId: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '08:00',
    endTime: '17:00',
    description: '',
    includeWeekend: false,
    includeSunday: false,
    includeHoliday: false
  })
  
  const [loading, setLoading] = useState(false)

  // Proteção: Redirecionar usuários clientes
  useEffect(() => {
    if (user && user.is_client) {
      router.push('/denied')
    }
  }, [user, router])

  // Se for cliente, não renderizar nada enquanto redireciona
  if (user?.is_client) {
    return null
  }

  const calculateHours = () => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}:00`)
      const end = new Date(`2000-01-01T${formData.endTime}:00`)
      const diffMs = end.getTime() - start.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      return diffHours > 0 ? diffHours.toFixed(2) : '0.00'
    }
    return '0.00'
  }

  const calculateTotalDays = () => {
    if (formData.startDate && formData.endDate) {
      // Usar a mesma lógica do generateDateRange para consistência
      const datesToProcess = generateDateRange()
      return datesToProcess.length
    }
    return 1
  }

  const shouldIncludeDate = (date: Date) => {
    const dayOfWeek = date.getDay()
    
    // Verifica se é sábado (6) e se deve incluir
    if (dayOfWeek === 6 && !formData.includeWeekend) return false
    
    // Verifica se é domingo (0) e se deve incluir
    if (dayOfWeek === 0 && !formData.includeSunday) return false
    
    // Aqui você pode adicionar lógica para feriados se necessário
    // Por enquanto, assumimos que includeHoliday permite todos os feriados
    
    return true
  }

  const generateDateRange = () => {
    const dates = []
    
    // Criar datas em horário local para evitar problemas de timezone
    const [startYear, startMonth, startDay] = formData.startDate.split('-').map(Number)
    const [endYear, endMonth, endDay] = formData.endDate.split('-').map(Number)
    
    const start = new Date(startYear, startMonth - 1, startDay) // mês é 0-indexed
    const end = new Date(endYear, endMonth - 1, endDay)
    
    // Criar uma nova data para cada iteração para evitar modificar a referência
    const current = new Date(start)
    
    while (current <= end) {
      if (shouldIncludeDate(current)) {
        dates.push(new Date(current)) // Criar uma nova instância para o array
      }
      
      // Avançar para o próximo dia de forma segura
      current.setDate(current.getDate() + 1)
    }
    
    return dates
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Usuário não autenticado')
      return
    }

    if (!formData.partnerId || !formData.projectId || !formData.ticketId || !formData.description) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      return
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('Data final deve ser posterior ou igual à data inicial')
      return
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`)
    const endDateTime = new Date(`${formData.startDate}T${formData.endTime}:00`)
    const minutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60))

    if (minutes <= 0) {
      toast.error('Horário de fim deve ser posterior ao horário de início')
      return
    }

    const datesToProcess = generateDateRange()
    
    if (datesToProcess.length === 0) {
      toast.error('Nenhuma data válida encontrada no período selecionado')
      return
    }

    setLoading(true)

    try {
      let successCount = 0
      let errorCount = 0

      for (const currentDate of datesToProcess) {
        try {
          const dateString = format(currentDate, 'yyyy-MM-dd')
          
          // Criar o apontamento de horas usando o ticket selecionado
          const hoursResponse = await fetch('/api/ticket-hours', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              project_id: formData.projectId,
              ticket_id: formData.ticketId,
              user_id: user.id,
              minutes: minutes,
              appoint_date: dateString,
              appoint_start: `${dateString}T${formData.startTime}:00`,
              appoint_end: `${dateString}T${formData.endTime}:00`,
            }),
          })

          if (!hoursResponse.ok) {
            throw new Error(`Erro ao registrar horas para ${format(currentDate, 'dd/MM/yyyy')}`)
          }

          successCount++
        } catch (error) {
          console.error(`Erro ao processar ${format(currentDate, 'dd/MM/yyyy')}:`, error)
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} apontamento(s) registrado(s) com sucesso!`)
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} apontamento(s) falharam`)
      }

      // Reset form apenas se todos foram bem-sucedidos
      if (errorCount === 0) {
        setFormData({
          ...formData,
          description: '',
          startTime: '08:00',
          endTime: '17:00'
        })
      }

    } catch (error) {
      console.error('Erro ao enviar formulário:', error)
      toast.error('Erro ao registrar horas. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-full mx-auto p-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Apontamento de Horas</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Parceiro */}
          <div className="space-y-2 w-full w-max-full">
            <Label htmlFor="partnerId">Parceiro *</Label>
            <Select
              value={formData.partnerId}
              onValueChange={(value) => {
                setFormData({ ...formData, partnerId: value, projectId: '', ticketId: '' })
                setSelectedPartnerId(value)
                setSelectedProjectId('')
              }}
            >
              <SelectTrigger className="space-y-2 w-full w-max-full">
                <SelectValue placeholder="Escolha o seu parceiro..." />
              </SelectTrigger>
              <SelectContent className="space-y-2 w-full w-max-full">
                {partnersLoading ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : (
                  partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Projeto */}
          <div className="space-y-2 w-full w-max-full">
            <Label htmlFor="projectId">Projeto *</Label>
            <Select
              value={formData.projectId}
              onValueChange={(value) => {
                setFormData({ ...formData, projectId: value, ticketId: '' })
                setSelectedProjectId(value)
              }}
              disabled={!formData.partnerId}
            >
              <SelectTrigger className="space-y-2 w-full w-max-full">
                <SelectValue placeholder="Selecione a atividade..." />
              </SelectTrigger>
              <SelectContent>
                {projectsLoading ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Ticket */}
          <div className="space-y-2 w-full w-max-full">
            <Label htmlFor="ticketId">Ticket *</Label>
            <Select
              value={formData.ticketId}
              onValueChange={(value) => setFormData({ ...formData, ticketId: value })}
              disabled={!formData.projectId}
            >
              <SelectTrigger className='space-y-2 w-full w-max-full'>
                <SelectValue placeholder="Selecione o ticket..." />
              </SelectTrigger>
              <SelectContent>
                {ticketsLoading ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <SelectItem key={ticket.id} value={ticket.id}>
                      #{ticket.id.slice(-6)} - {ticket.title}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-tickets" disabled>Nenhum ticket disponível</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Data início */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Data Início *</Label>
            <div className="relative">
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="pl-10"
              />
              <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Data fim */}
          <div className="space-y-2">
            <Label htmlFor="endDate">Data Fim *</Label>
            <div className="relative">
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="pl-10"
              />
              <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Hora início */}
          <div className="space-y-2">
            <Label htmlFor="startTime">Hora Início *</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>

          {/* Hora fim */}
          <div className="space-y-2">
            <Label htmlFor="endTime">Hora Fim *</Label>
            <Input
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
        </div>

        {/* Horas calculadas e resumo */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Horas por dia:
            </span>
            <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {calculateHours()}h
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Dias no período:
            </span>
            <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {calculateTotalDays()} dia(s)
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-blue-200 dark:border-blue-800 pt-2">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Total estimado:
            </span>
            <span className="text-xl font-bold text-blue-900 dark:text-blue-100">
              {(parseFloat(calculateHours()) * calculateTotalDays()).toFixed(2)}h
            </span>
          </div>
        </div>

        {/* Opções de inclusão */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Opções Especiais</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeWeekend"
                checked={formData.includeWeekend}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, includeWeekend: !!checked })
                }
              />
              <Label htmlFor="includeWeekend">Incluir Sábado</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeSunday"
                checked={formData.includeSunday}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, includeSunday: !!checked })
                }
              />
              <Label htmlFor="includeSunday">Incluir Domingo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeHoliday"
                checked={formData.includeHoliday}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, includeHoliday: !!checked })
                }
              />
              <Label htmlFor="includeHoliday">Incluir Feriado</Label>
            </div>
          </div>
        </div>

        {/* Resumo das Atividades */}
        <div className="space-y-2">
          <Label htmlFor="description">Resumo das Atividades *</Label>
          <Textarea
            id="description"
            placeholder="Digite aqui o resumo das atividades realizadas..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />
        </div>

        {/* Botão de envio */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Enviando...' : 'Enviar horas'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default TimeSheetCreatePage
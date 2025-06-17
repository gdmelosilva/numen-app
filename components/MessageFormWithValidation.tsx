import React, { useState } from 'react';
import { MessageValidationWrapper } from './MessageValidationWrapper';
import { useCanUserLogHours, useCanUserSendMessage, useUserInContract } from '@/hooks/useCanUserLog';

interface MessageFormProps {
  readonly projectId: string;
  readonly contractHoursMax?: number;
  readonly onSubmit: (data: { body: string; hours?: number; is_private: boolean }) => Promise<void>;
}

export function MessageForm({ projectId, contractHoursMax, onSubmit }: MessageFormProps) {
  const [message, setMessage] = useState('');
  const [hours, setHours] = useState<number | undefined>();
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userInContract, loading } = useUserInContract(projectId);
  const { canLog } = useCanUserLogHours(projectId, contractHoursMax);
  const { canSend } = useCanUserSendMessage(projectId, userInContract ?? undefined, loading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSend) {
      alert('Você não tem permissão para enviar mensagens neste ticket.');
      return;
    }

    if (hours && !canLog) {
      alert('Você não pode apontar horas neste momento.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        body: message,
        hours: hours && canLog ? hours : undefined,
        is_private: isPrivate
      });
      
      // Limpar formulário após sucesso
      setMessage('');
      setHours(undefined);
      setIsPrivate(false);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Validação para envio de mensagens */}
      <MessageValidationWrapper 
        projectId={projectId}
        contractHoursMax={contractHoursMax}
        showMessageValidation={true}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo de mensagem */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Mensagem
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Digite sua mensagem..."
              required
            />
          </div>

          {/* Campo de horas - só aparece se o usuário pode apontar horas */}
          {canLog && (
            <div>
              <label htmlFor="hours" className="block text-sm font-medium text-gray-700">
                Horas trabalhadas (opcional)
              </label>
              <input
                id="hours"
                type="number"
                step="0.25"
                min="0"
                value={hours ?? ''}
                onChange={(e) => setHours(e.target.value ? parseFloat(e.target.value) : undefined)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Ex: 2.5"
              />
            </div>
          )}

          {/* Checkbox para mensagem privada */}
          <div className="flex items-center">
            <input
              id="is_private"
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="is_private" className="ml-2 block text-sm text-gray-900">
              Mensagem privada (apenas equipe interna)
            </label>
          </div>

          {/* Botão de envio */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !message.trim() || !canSend}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
            </button>
          </div>
        </form>
      </MessageValidationWrapper>

      {/* Validação para apontamento de horas - aviso separado */}
      {!canLog && (
        <MessageValidationWrapper 
          projectId={projectId}
          contractHoursMax={contractHoursMax}
          showHoursValidation={true}
        >
          <div></div> {/* Conteúdo vazio, só para mostrar o aviso */}
        </MessageValidationWrapper>
      )}
    </div>
  );
}

import React from 'react';
import { useCanUserLogHours, useCanUserSendMessage, useUserInContract } from '@/hooks/useCanUserLog';

interface MessageValidationWrapperProps {
  readonly projectId: string;
  readonly contractHoursMax?: number;
  readonly children: React.ReactNode;
  readonly showHoursValidation?: boolean;
  readonly showMessageValidation?: boolean;
}

/**
 * Componente wrapper que valida se o usuário pode apontar horas ou enviar mensagens
 * antes de renderizar os componentes filhos
 */
export function MessageValidationWrapper({ 
  projectId, 
  contractHoursMax, 
  partnerId, // novo parâmetro opcional
  children, 
  showHoursValidation = false,
  showMessageValidation = false 
}: MessageValidationWrapperProps & { partnerId?: string }) {  const { userInContract, loading: contractLoading } = useUserInContract(projectId);
  const { canLog, reason: hoursReason, loading: hoursLoading } = useCanUserLogHours(projectId, contractHoursMax);
  const { canSend, reason: messageReason, isClient } = useCanUserSendMessage(projectId, userInContract ?? undefined, contractLoading, partnerId);

  // Debug temporário
  if (process.env.NODE_ENV === 'development') {
    console.log('MessageValidationWrapper Debug:', {
      projectId,
      userInContract,
      contractLoading,
      canSend,
      messageReason,
      isClient,
      canLog,
      hoursReason
    });
  }

  if (contractLoading || hoursLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Verificando permissões...</p>
      </div>
    );
  }

  // Validação para apontamento de horas
  if (showHoursValidation && !canLog) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Não é possível apontar horas
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{hoursReason}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Validação para envio de mensagens
  if (showMessageValidation && !canSend) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Não é possível enviar mensagens
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>{messageReason}</p>
              {isClient && (
                <p className="mt-1 text-xs">
                  Usuários clientes só podem enviar mensagens se estiverem vinculados ao contrato.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se passou por todas as validações, renderiza os componentes filhos
  return <>{children}</>;
}

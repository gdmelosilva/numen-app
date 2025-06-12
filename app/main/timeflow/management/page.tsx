import React from 'react'
import { Ban } from 'lucide-react'
import { Card } from '@/components/ui/card'

const TimeFlowManagementPage = () => {
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 mt-32">
        <div className="flex flex-col items-center justify-center p-8 align-center">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-red-100 dark:bg-red-900/20 rounded-full blur-xl animate-pulse"></div>
                <Ban className="relative w-20 h-20 text-red-500 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Inativado Temporariamente
            </h1>
            <p className="text-lg text-muted-foreground text-center max-w-md leading-relaxed">
                Esta funcionalidade está temporariamente inativa. Por favor, tente novamente mais tarde ou entre em contato com o suporte se precisar de acesso urgente.
            </p>
            <div className="mt-8 w-24 h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
        </div>
    </Card>
  )
}

export default TimeFlowManagementPage
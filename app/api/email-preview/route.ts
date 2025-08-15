import { generateEmailTemplate } from '@/lib/email-templates';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sampleData = {
      ticketId: '123',
      ticketExternalId: 'AMS-001',
      ticketTitle: 'Exemplo de Vinculação de Recurso',
      ticketDescription: 'Este é um exemplo de chamado que foi vinculado a um recurso. O chamado descreve um problema no sistema que precisa ser resolvido pela equipe técnica.',
      projectName: 'Projeto Demo - Sistema EasyTime',
      partnerName: 'Parceiro Demo Ltda',
      resourceName: 'João da Silva',
      resourceEmail: 'joao.silva@exemplo.com',
      categoryName: 'Suporte Técnico',
      assignedBy: 'Maria Administradora'
    };

    const template = generateEmailTemplate('ticket-assigned', sampleData);
    
    return new Response(template.html, {
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Erro ao gerar preview do template:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar preview do template' }, 
      { status: 500 }
    );
  }
}

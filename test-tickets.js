// Script de teste simples para verificar tickets no banco
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTickets() {
  console.log('Testando conexão com banco...');
  
  try {
    // Verificar total de tickets
    const { data: allTickets, error: allError } = await supabase
      .from('ticket')
      .select('*', { count: 'exact' });
    
    console.log('Total de tickets no banco:', allTickets?.length || 0);
    
    // Verificar tickets SmartCare (type_id = 1)
    const { data: smartcareTickets, error: smartcareError } = await supabase
      .from('ticket')
      .select('*')
      .eq('type_id', 1);
    
    console.log('Tickets SmartCare (type_id=1):', smartcareTickets?.length || 0);
    
    // Verificar tickets SmartBuild (type_id = 2)
    const { data: smartbuildTickets, error: smartbuildError } = await supabase
      .from('ticket')
      .select('*')
      .eq('type_id', 2);
    
    console.log('Tickets SmartBuild (type_id=2):', smartbuildTickets?.length || 0);
    
    // Mostrar alguns exemplos de projeto_id
    const { data: projectIds, error: projectError } = await supabase
      .from('ticket')
      .select('project_id')
      .limit(10);
    
    console.log('Exemplos de project_ids:', projectIds?.map(t => t.project_id));
    
    if (allError) console.error('Erro geral:', allError);
    if (smartcareError) console.error('Erro SmartCare:', smartcareError);
    if (smartbuildError) console.error('Erro SmartBuild:', smartbuildError);
    if (projectError) console.error('Erro project_ids:', projectError);
    
  } catch (err) {
    console.error('Erro na conexão:', err);
  }
}

testTickets();

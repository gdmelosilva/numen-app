import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendOutlookMail } from '@/lib/send-mail'
import { resetPasswordMagicLinkTemplate } from '@/lib/email-templates/resetPasswordMagicLink'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório.' }, { status: 400 })
    }

    // Valida a presença das envs (logue apenas nomes, nunca valores)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Configuração do servidor incompleta.' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    // Buscar nome do usuário (opcional)
    const { data: userData } = await supabase
      .from('user')
      .select('first_name, last_name')
      .eq('email', email)
      .single()



    const userName =
      userData ? [userData.first_name, userData.last_name].filter(Boolean).join(' ') : undefined

    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`

    // Gera link de recuperação (recomendado para reset de senha)
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    })

    if (error || !data?.properties?.action_link) {
      console.error('generateLink error:', error?.message)
      return NextResponse.json(
        { error: error?.message || 'Falha ao gerar link de redefinição.' },
        { status: 500 }
      )
    }

    const actionLink = data.properties.action_link

    const emailTemplate = resetPasswordMagicLinkTemplate({
      userName,
      actionLink,
    })

    await sendOutlookMail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Erro interno ao enviar o link de redefinição.' },
      { status: 500 }
    )
  }
}
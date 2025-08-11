"use client";

import React from "react";
import { NumenLogo } from "@/components/NumenLogo";
import { BrandLogoCloud } from "@/components/BrandLogoCloud";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Rocket, 
  ArrowRight, 
  Users, 
  Target,
  Smartphone,
  Monitor,
  AlertTriangle,
  Star,
  Zap
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useVersions } from "@/hooks/useVersions";
import { VersionCard } from "@/components/VersionCard";

export default function HomePage() {
  const { user, loading } = useUserProfile();
  const { versions, loading: versionsLoading, error: versionsError } = useVersions();
  
  // Função para obter o primeiro nome do usuário
  const getFirstName = () => {
    if (loading) return "...";
    if (!user) return "Usuário";
    
    // Tentar pegar o primeiro nome
    if (user.first_name) {
      return user.first_name;
    }
    
    // Fallback para email (pegar parte antes do @)
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return "Usuário";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-900 border-b">
        <div className="flex max-h-96 mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-left">
            <div className="flex flex-col justify-start mb-6">
              <div className="relative">
                <NumenLogo className="mb-4" />
                {/* <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div> */}
              </div>
            
                <h1 className="text-2xl md:text-3xl font-bold mb-6">
                  <span
                    style={{
                      background: "linear-gradient(90deg, #ff9800, #f44336)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                    >
                    Bem-vindo, {getFirstName()}!
                  </span>
                </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mb-8">
                Na <b>NUMEN LEAN SERVICES</b>, fornecemos soluções e serviços inovadores para uma ampla gama
                de setores. Nosso conhecimento e experiência nos permitem oferecer
                soluções personalizadas que impulsionam o sucesso.
              </p>
            </div>
          </div>
        </div>
        {/* Features Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 border-l-4 border-primary shadow-lg">
            <CardHeader className="flex flex-row items-start gap-3 pb-0">
              <div className="flex-shrink-0 mt-1">
          <Target className="text-primary" size={28} />
              </div>
              <CardTitle className="text-primary">
          Excelência em Transformação Digital
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
          Serviços para todas as fases da transformação do seu negócio.
          Conectamos pessoas e tecnologia para impulsionar eficiência,
          crescimento e inovação.
              </p>
            </CardContent>
          </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 border-l-4 border-secondary shadow-lg">
            <CardHeader className="flex flex-row items-start gap-3 pb-0">
              <div className="flex-shrink-0 mt-1">
            <Zap className="text-secondary" size={28} />
              </div>
              <CardTitle className="text-secondary">
            Soluções Personalizadas e Ágeis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
            Desenvolvemos soluções sob medida utilizando metodologias ágeis 
            e tecnologias de ponta. Cada projeto é único e merece uma 
            abordagem personalizada para máximos resultados.
              </p>
            </CardContent>
            </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 border-l-4 border-orange shadow-lg">
            <CardHeader className="flex flex-row items-start gap-3 pb-0">
              <div className="flex-shrink-0 mt-1">
          <Users className="text-orange" size={28} />
              </div>
              <CardTitle className="text-orange">
          Compromisso e Colaboração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
          Mais do que uma empresa, somos um coletivo movido por valores,
          colaboração genuína e compromisso com o sucesso dos nossos
          clientes.
              </p>
            </CardContent>
          </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 border-l-4 border-approved shadow-lg">
            <CardHeader className="flex flex-row items-start gap-3 pb-0">
              <div className="flex-shrink-0 mt-1">
              <Rocket className="text-approved" size={28} />
              </div>
              <CardTitle className="text-approved">
              Inovação e Resultados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
              Utilizamos metodologias lean e tecnologias de ponta para 
              acelerar a entrega de projetos e maximizar o retorno sobre 
              investimento dos nossos clientes.
              </p>
            </CardContent>
            </Card>
        </div>

        {/* Brands Section */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-0">
            Com a confiança de marcas ao redor do mundo
          </h2>
          <BrandLogoCloud />
        </div>
      </div>

      {/* Main Content */}
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Beta Warning Section */}
        <div className="mb-16">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  🚧 Versão Beta - Em Desenvolvimento
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Este sistema está em fase beta. Algumas funcionalidades podem estar em desenvolvimento 
                  ou apresentar comportamentos inesperados. Agradecemos seu feedback para melhorarmos 
                  continuamente a plataforma.
                </p>
              </div>
            </div>
          </div>
        </div>

          <div className="flex items-start mb-8">
            <div className="flex-shrink-0 mr-4 ">
              <div className="w-16 h-16 bg-gradient-to-br from-[#231c38] to-[#271e45] rounded-xl flex items-center justify-center shadow-lg">
                <Image
                  src="/ÍCONE AZUL E LARANJA.svg"
                  alt="Numen Logo"
                  width={40}
                  height={40}
                />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Bem-vindo ao <span className="text-[#297ad1]">EasyTime!</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                O EasyTime é um serviço de administração e gerenciamento de projetos, voltado à manutenção contínua, desenvolvido pela equipe da GrowBridge!
              </p>
              <p className="text-gray-600 dark:text-gray-300 mt-0 ">
                O intuito do serviço é proporcionar uma experiência fluida e eficiente na gestão de projetos e atividades, permitindo que as equipes se concentrem na entrega de resultados e os clientes tenham uma visão clara do progresso e, uma fácil comunicação com a equipe.
              </p>
            </div>
          </div>

        {/* What's New Section */}
        <div className="mb-16">
          <div className="flex items-start mb-8">
            <div className="flex-shrink-0 mr-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Star className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                O que há de novo?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Até nossa data oficial de lançamento, estaremos sempre aprontando por aqui 👀 
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Acompanhe abaixo as últimas atualizações e melhorias implementadas no EasyTime:
              </p>
            </div>
          </div>

          {/* Version Cards */}
          <div className="space-y-6 mb-12">
            {versionsLoading ? (
              <div className="flex justify-center py-12">
                <div className="text-gray-600 dark:text-gray-300">Carregando versões...</div>
              </div>
            ) : versionsError ? (
              <div className="flex justify-center py-12">
                <div className="text-red-600 dark:text-red-400">Erro ao carregar versões: {versionsError}</div>
              </div>
            ) : (
              versions.map((version) => (
                <VersionCard key={version.id} version={version} />
              ))
            )}
          </div>
        </div>

        {/* Action Cards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Support Card */}
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
                    🎯 Precisa de ajuda com o sistema?
                  </h3>
                  <p className="text-blue-100 mb-6">
                    Nossa equipe está pronta para auxiliar você!
                  </p>
                  <Link href="https://forms.office.com/r/Zz48xEeDeJ" className="text-white hover:text-white/50 font-medium flex items-center">
                    Acionar Suporte <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-24 h-32 bg-white/20 rounded-xl flex items-center justify-center">
                    <Monitor className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Card */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    💬 Envie seu Feedback
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    Ajude-nos a melhorar o sistema
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    com suas sugestões e comentários.
                  </p>
                  <Link href="https://forms.office.com/r/Zz48xEeDeJ" className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
                    Enviar feedback <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-24 h-32 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

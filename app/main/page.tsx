"use client";

import React from "react";
import { NumenLogo } from "@/components/NumenLogo";
import { BrandLogoCloud } from "@/components/BrandLogoCloud";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Handshake, Rocket } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden ">
      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center gap-8 py-12">
        <NumenLogo className="mb-2" />
        <h1
          className="text-3xl md:text-4xl font-extrabold text-center"
          style={{
            background: "linear-gradient(90deg, #ff9800, #f44336)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Seja bem-vindo à Numen Lean Services
        </h1>
        <p className="text-[#383434] dark:text-white text-lg md:text-xl text-center max-w-2xl text-muted-foreground">
          Na NUMEN, fornecemos soluções e serviços inovadores para uma ampla gama
          de setores. Nosso conhecimento e experiência nos permitem entender os
          desafios e requisitos exclusivos de cada setor, o que nos permite
          oferecer soluções personalizadas que impulsionam o sucesso.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-8">
          <Card className="bg-white/80 dark:bg-secondary/80 backdrop-blur border-0 border-l-4 border-primary shadow-lg flex flex-col">
            <CardHeader className="flex flex-row items-start gap-3 pb-0">
              <div className="flex-shrink-0 mt-1">
                <Rocket className="text-primary" size={28} />
              </div>
              <CardTitle className="text-primary">
                Excelência em Transformação Digital
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex">
                <p className="text-[#383434] dark:text-white">
                  Serviços para todas as fases da transformação do seu negócio.
                  Conectamos pessoas e tecnologia para impulsionar eficiência,
                  crescimento e inovação.
                </p>
              </div>
            </CardContent>
          </Card>
            <Card className="bg-white/80 dark:bg-secondary/80 backdrop-blur border-0 border-l-4 border-accent shadow-lg flex flex-col">
            <CardHeader className="flex flex-row items-start gap-3 pb-0">
              <div className="flex-shrink-0 mt-1">
                <Handshake className="text-accent" size={28} />
              </div>
              <CardTitle className="text-accent">
                Compromisso e Colaboração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="pl-4">
                <p className="text-[#383434] dark:text-white">
                  Mais do que uma empresa, somos um coletivo movido por valores,
                  colaboração genuína e compromisso com o sucesso dos nossos
                  clientes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="w-full mt-10">
          <h2 className="text-xl font-semibold text-center mb-4 text-foreground">
            Com a confiança de marcas ao redor do mundo
          </h2>
          <BrandLogoCloud />
        </div>
      </div>
    </div>
  );
}

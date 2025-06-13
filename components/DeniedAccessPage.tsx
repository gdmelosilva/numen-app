import { Ban } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function DeniedAccessPage() {
    return (
        <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 mt-32 border-l-4 border-red-500">
            <CardHeader className="items-center">
                <Ban className="w-20 h-20 text-red-500 animate-pulse mb-4" />
                <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Acesso Restrito
                </CardTitle>
                <CardDescription className="text-lg text-center max-w-md leading-relaxed">
                    Você não tem permissão para acessar esta funcionalidade. Caso acredite que isso é um engano, entre em contato com o suporte.
                </CardDescription>
                <Link
                    href="/"
                    className="mt-6 inline-block px-6 py-2 rounded bg-red-500 text-white font-semibold hover:bg-red-600 transition"
                >
                    Voltar para a página inicial
                </Link>
            </CardHeader>
        </Card>
    );
}
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GitBranch, Zap, Star, Bug, Rocket, Shield } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface VersionChange {
  type: "feature" | "improvement" | "bugfix" | "major" | "security";
  description: string;
  priority?: "major" | "minor";
  items?: string[];
}

export interface Version {
  id: string;
  version: string;
  title: string;
  releaseDate: string;
  isLatest: boolean;
  isStable: boolean;
  changes: VersionChange[];
}

interface VersionCardProps {
  version: Version;
}

const getChangeIcon = (type: VersionChange["type"]) => {
  switch (type) {
    case "feature":
      return <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />;
    case "improvement":
      return <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />;
    case "bugfix":
      return <Bug className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />;
    case "major":
      return <Rocket className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />;
    case "security":
      return <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />;
    default:
      return <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />;
  }
};

const formatReleaseDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, "d 'de' MMMM', 'yyyy", { locale: ptBR });
  } catch {
    return dateString;
  }
};

export function VersionCard({ version }: VersionCardProps) {
  return (
    <Card 
      className={`bg-white dark:bg-gray-800 border-0 shadow-lg ${
        version.isLatest ? "border-l-4 border-green-500" : ""
      }`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                version.isLatest 
                  ? "bg-green-100 dark:bg-green-900" 
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              <GitBranch 
                className={`w-5 h-5 ${
                  version.isLatest 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-gray-600 dark:text-gray-400"
                }`} 
              />
            </div>
            <div>
              <CardTitle className="text-gray-900 dark:text-white">
                {version.title}
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Lançada em {formatReleaseDate(version.releaseDate)}
              </p>
            </div>
          </div>
          {version.isLatest && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
              Mais recente
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {version.changes.map((change, index) => (
            <div key={index} className="flex items-start space-x-3">
              {getChangeIcon(change.type)}
              <div className="flex-1">
                <span className={`text-gray-700 dark:text-gray-300 ${
                  change.priority === "minor" 
                    ? "text-sm opacity-80" 
                    : "text-base"
                }`}>
                  {change.description}
                </span>
                {change.items && change.items.length > 0 && (
                  <ul className="mt-2 ml-4 space-y-1">
                    {change.items.map((item, itemIndex) => (
                      <li key={itemIndex} className={`text-gray-600 dark:text-gray-400 ${
                        change.priority === "minor" 
                          ? "text-xs" 
                          : "text-sm"
                      } flex items-start`}>
                        <span className="mr-2 text-gray-400">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

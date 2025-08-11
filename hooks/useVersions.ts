import { useState, useEffect } from "react";
import type { Version } from "@/components/VersionCard";

interface VersionsData {
  versions: Version[];
}

export function useVersions() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVersions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Importar o arquivo JSON dinamicamente
        const versionsData = await import("@/data/versions.json") as VersionsData;
        
        // Ordenar versões por data de lançamento (mais recente primeiro)
        const sortedVersions = versionsData.versions.sort((a, b) => {
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
        });
        
        setVersions(sortedVersions);
      } catch (err) {
        console.error("Erro ao carregar versões:", err);
        setError("Erro ao carregar informações de versões");
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, []);

  return {
    versions,
    loading,
    error,
    latestVersion: versions.find(v => v.isLatest),
    stableVersions: versions.filter(v => v.isStable),
  };
}

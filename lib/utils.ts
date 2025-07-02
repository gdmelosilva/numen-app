import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as XLSX from 'xlsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Format phone number to (XX) XXXXX-XXXX format
export const formatPhoneNumber = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 0) {
    return "";
  } else if(cleaned.length <= 2) {
    return `(${cleaned}`;
  } else if (cleaned.length <= 7) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  } else {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  }
};

// Format CPF (XXX.XXX.XXX-XX) or CNPJ (XX.XXX.XXX/XXXX-XX) depending on length
export const formatCpfCnpj = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 11) {
    // Format as CPF
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    } else if (cleaned.length <= 9) {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    } else {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
    }
  } else {
    // Format as CNPJ
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 5) {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
    } else if (cleaned.length <= 8) {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
    } else if (cleaned.length <= 12) {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
    } else {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
    }
  }
};

// Format CEP to XXXXX-XXX format
export const formatCEP = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 5) {
    return cleaned;
  } else {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  }
};

// Format currency to Brazilian Real format
export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return 'R$ 0,00';
  }
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
};

export const export_to_xls = (data: unknown[], filename: string = 'export') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
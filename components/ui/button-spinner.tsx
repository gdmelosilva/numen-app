import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ButtonSpinnerProps extends ButtonProps {
  /**
   * Whether to show the loading spinner
   */
  loading?: boolean;
  /**
   * Optional text to show alongside the spinner
   */
  loadingText?: string;
  /**
   * Button content
   */
  children: React.ReactNode;
}

/**
 * ButtonSpinner - Um botão que mostra um spinner durante operações assíncronas
 * 
 * @example
 * // Uso básico
 * <ButtonSpinner loading={isLoading} onClick={handleSave}>
 *   Salvar
 * </ButtonSpinner>
 * 
 * @example
 * // Com texto de loading
 * <ButtonSpinner loading={isLoading} loadingText="Salvando..." onClick={handleSave}>
 *   Salvar
 * </ButtonSpinner>
 * 
 * @example
 * // Com variantes e tamanhos
 * <ButtonSpinner 
 *   loading={isLoading} 
 *   variant="outline" 
 *   size="sm" 
 *   onClick={handleUpdate}
 * >
 *   Atualizar
 * </ButtonSpinner>
 */
const ButtonSpinner = React.forwardRef<HTMLButtonElement, ButtonSpinnerProps>(
  ({ loading = false, loadingText, children, disabled, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        className={cn("min-w-20", className)}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
            {loadingText && (
              <span>{loadingText}</span>
            )}
          </div>
        ) : (
          children
        )}
      </Button>
    );
  }
);

ButtonSpinner.displayName = "ButtonSpinner";

export { ButtonSpinner };
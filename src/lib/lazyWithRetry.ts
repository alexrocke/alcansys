import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "scalefy:chunk-reload";

/**
 * React.lazy com retry automático.
 * Após um deploy, os arquivos antigos (hashed chunks) deixam de existir e o
 * import dinâmico falha. Aqui tentamos novamente e, se persistir, recarregamos
 * a página uma única vez para buscar o novo index.html/manifest.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem(RELOAD_KEY);
      return mod;
    } catch (error) {
      // segunda tentativa (falha de rede momentânea)
      try {
        const mod = await factory();
        sessionStorage.removeItem(RELOAD_KEY);
        return mod;
      } catch (retryError) {
        const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === "1";
        if (!alreadyReloaded) {
          sessionStorage.setItem(RELOAD_KEY, "1");
          window.location.reload();
          // evita renderizar erro antes do reload
          return new Promise<{ default: T }>(() => {});
        }
        throw retryError;
      }
    }
  });
}

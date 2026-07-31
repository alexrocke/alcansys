import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type Request = ConfirmOptions & { resolve: (value: boolean) => void };

let emit: ((req: Request) => void) | null = null;

/**
 * Imperative confirmation dialog. Replaces window.confirm() with a styled,
 * non-blocking AlertDialog. Requires <ConfirmDialogHost /> mounted once.
 */
export function confirmDialog(options: ConfirmOptions | string): Promise<boolean> {
  const opts = typeof options === "string" ? { description: options } : options;
  if (!emit) return Promise.resolve(window.confirm(opts.description ?? "Confirmar?"));
  return new Promise<boolean>((resolve) => emit!({ ...opts, resolve }));
}

export function ConfirmDialogHost() {
  const [request, setRequest] = useState<Request | null>(null);

  useEffect(() => {
    emit = (req) => setRequest(req);
    return () => {
      emit = null;
    };
  }, []);

  const close = (value: boolean) => {
    request?.resolve(value);
    setRequest(null);
  };

  return (
    <AlertDialog open={!!request} onOpenChange={(open) => !open && close(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{request?.title ?? "Tem certeza?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {request?.description ?? "Esta ação não pode ser desfeita."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => close(false)}>
            {request?.cancelLabel ?? "Cancelar"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => close(true)}
            className={
              request?.destructive === false
                ? undefined
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            }
          >
            {request?.confirmLabel ?? "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

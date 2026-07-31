import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Search,
  FolderKanban,
  Users,
  Contact,
  ListChecks,
  LayoutDashboard,
  DollarSign,
  MessagesSquare,
  Settings,
  FileText,
  Zap,
} from "lucide-react";

const pages = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projetos", url: "/projetos", icon: FolderKanban },
  { title: "Tarefas", url: "/tarefas", icon: ListChecks },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Leads & CRM", url: "/leads", icon: Contact },
  { title: "Conversas", url: "/conversas", icon: MessagesSquare },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Automações", url: "/automacoes", icon: Zap },
  { title: "Documentos", url: "/documentos", icon: FileText },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

function useDebounced(value: string, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query);
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const term = debouncedQuery.trim();
  const enabled = open && !!companyId && term.length >= 2;

  const { data: results, isFetching } = useQuery({
    queryKey: ["global-search", companyId, term],
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const like = `%${term}%`;
      const [clients, projects, leads, tasks] = await Promise.all([
        supabase
          .from("clients")
          .select("id, nome")
          .eq("company_id", companyId!)
          .ilike("nome", like)
          .limit(5),
        supabase
          .from("projects")
          .select("id, nome")
          .eq("company_id", companyId!)
          .ilike("nome", like)
          .limit(5),
        supabase
          .from("leads")
          .select("id, nome")
          .eq("company_id", companyId!)
          .ilike("nome", like)
          .limit(5),
        supabase
          .from("project_tasks")
          .select("id, titulo, project_id")
          .eq("company_id", companyId!)
          .ilike("titulo", like)
          .limit(5),
      ]);

      return {
        clients: clients.data ?? [],
        projects: projects.data ?? [],
        leads: leads.data ?? [],
        tasks: tasks.data ?? [],
      };
    },
  });

  const go = (url: string) => {
    setOpen(false);
    setQuery("");
    navigate(url);
  };

  const filteredPages = useMemo(() => {
    if (!term) return pages;
    return pages.filter((p) => p.title.toLowerCase().includes(term.toLowerCase()));
  }, [term]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 gap-2 text-muted-foreground px-2 sm:px-3"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline text-xs">Buscar...</span>
        <kbd className="hidden md:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar clientes, projetos, leads, tarefas..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isFetching ? "Buscando..." : "Nenhum resultado encontrado."}
          </CommandEmpty>

          {filteredPages.length > 0 && (
            <CommandGroup heading="Navegar">
              {filteredPages.map((p) => (
                <CommandItem key={p.url} value={`pagina ${p.title}`} onSelect={() => go(p.url)}>
                  <p.icon className="mr-2 h-4 w-4" />
                  {p.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!!results?.projects.length && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Projetos">
                {results.projects.map((p: any) => (
                  <CommandItem key={p.id} value={`projeto ${p.nome} ${p.id}`} onSelect={() => go(`/projetos/${p.id}`)}>
                    <FolderKanban className="mr-2 h-4 w-4" />
                    {p.nome}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {!!results?.clients.length && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Clientes">
                {results.clients.map((c: any) => (
                  <CommandItem key={c.id} value={`cliente ${c.nome} ${c.id}`} onSelect={() => go(`/clientes/${c.id}`)}>
                    <Users className="mr-2 h-4 w-4" />
                    {c.nome}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {!!results?.leads.length && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Leads">
                {results.leads.map((l: any) => (
                  <CommandItem key={l.id} value={`lead ${l.nome} ${l.id}`} onSelect={() => go(`/leads`)}>
                    <Contact className="mr-2 h-4 w-4" />
                    {l.nome}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {!!results?.tasks.length && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Tarefas">
                {results.tasks.map((t: any) => (
                  <CommandItem
                    key={t.id}
                    value={`tarefa ${t.titulo} ${t.id}`}
                    onSelect={() => go(t.project_id ? `/projetos/${t.project_id}` : "/tarefas")}
                  >
                    <ListChecks className="mr-2 h-4 w-4" />
                    {t.titulo}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Selo } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LIMITES_ALUNO, PLANOS_OFICIAIS, normalizarEmail } from "@/lib/cadastro-alunos";
import {
  importarAlunos,
  type AlunoDoCadastro,
  type ResultadoDaImportacao,
} from "@/lib/cadastro-alunos.functions";
import { hojeBrasilia } from "@/lib/datas";
import { traduzErroServidor } from "@/lib/erros-servidor";
import { analisarImportacao, MODELO_CSV } from "@/lib/importacao-alunos";

/** Lê o arquivo como UTF-8 e, se não for, como Windows-1252 (o "CSV" padrão do Excel no Brasil). */
async function lerArquivo(arquivo: File): Promise<string> {
  const bytes = await arquivo.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

function baixarModelo() {
  const blob = new Blob([MODELO_CSV], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo-de-alunos.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const ROTULO_ESTADO = {
  novo: { tom: "ok", texto: "Novo" },
  duplicado: { tom: "atencao", texto: "Já existe" },
  erro: { tom: "alerta", texto: "Corrigir" },
} as const;

/** Importação de alunos por planilha: prévia com o que entra, o que já existe e o que tem erro. */
export function ImportarAlunos({
  aberto,
  aoMudarAberto,
  existentes,
  aoImportar,
}: {
  aberto: boolean;
  aoMudarAberto: (aberto: boolean) => void;
  existentes: readonly AlunoDoCadastro[];
  aoImportar: () => void;
}) {
  const importar = useServerFn(importarAlunos);
  const [texto, setTexto] = useState("");
  const [planoPadrao, setPlanoPadrao] = useState("");
  const [resultado, setResultado] = useState<ResultadoDaImportacao | null>(null);

  const analise = useMemo(
    () =>
      texto.trim() === ""
        ? null
        : analisarImportacao(texto, {
            hoje: hojeBrasilia(),
            existentes: existentes.map((e) => ({
              nome: e.nome,
              email: normalizarEmail(e.email),
              telefone: e.telefone,
            })),
            planoPadrao,
          }),
    [texto, planoPadrao, existentes],
  );

  const gravar = useMutation({
    mutationFn: () => importar({ data: { texto, planoPadrao } }),
    onSuccess: (r) => {
      setResultado(r);
      toast.success(`${r.importados} aluno(s) importado(s).`);
      aoImportar();
    },
    onError: (e: Error) => toast.error(traduzErroServidor(e)),
  });

  function fechar(valor: boolean) {
    if (!valor) {
      setTexto("");
      setResultado(null);
    }
    aoMudarAberto(valor);
  }

  const comProblema = analise?.linhas.filter((l) => l.estado !== "novo") ?? [];

  return (
    <Dialog open={aberto} onOpenChange={fechar}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar alunos por planilha</DialogTitle>
          <DialogDescription>
            Use um arquivo CSV (no Excel: Salvar como &gt; CSV). A primeira linha tem os títulos das
            colunas: Nome e Plano são obrigatórios; E-mail, Telefone, Turno, Status, Idade, Altura,
            Peso, Matrícula, Objetivo e Observações são opcionais.
          </DialogDescription>
        </DialogHeader>

        {resultado ? (
          <div className="space-y-4">
            <p
              role="status"
              className="rounded-2xl border border-brand-yellow/40 bg-brand-yellow/10 p-4 text-sm"
            >
              <strong>{resultado.importados}</strong> aluno(s) importado(s).{" "}
              {resultado.duplicados > 0
                ? `${resultado.duplicados} já existiam e foram pulados. `
                : ""}
              {resultado.comErro > 0
                ? `${resultado.comErro} linha(s) com erro ficaram de fora.`
                : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              Peça aos alunos para criar o acesso em <strong>/auth</strong> com o mesmo e-mail da
              ficha: a conta se liga sozinha.
            </p>
            <DialogFooter>
              <Button type="button" onClick={() => fechar(false)} className="min-h-11 rounded-full">
                Concluir
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={baixarModelo}
                className="min-h-11 gap-2 rounded-full"
              >
                <Download className="size-4" aria-hidden /> Baixar planilha de exemplo
              </Button>
              <Label
                htmlFor="arquivo-de-alunos"
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-input px-4 text-sm font-medium hover:bg-foreground/5"
              >
                <FileUp className="size-4" aria-hidden /> Escolher arquivo
              </Label>
              <input
                id="arquivo-de-alunos"
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                className="sr-only"
                onChange={async (e) => {
                  const arquivo = e.target.files?.[0];
                  e.target.value = "";
                  if (!arquivo) return;
                  if (arquivo.size > LIMITES_ALUNO.tamanhoDoArquivo) {
                    toast.error("O arquivo é grande demais. Divida a planilha em partes menores.");
                    return;
                  }
                  setTexto(await lerArquivo(arquivo));
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="texto-de-alunos">Ou cole a planilha aqui</Label>
              <Textarea
                id="texto-de-alunos"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={5}
                placeholder={
                  "Nome;E-mail;Telefone;Plano\nMaria Exemplo;maria@exemplo.com;(11) 98888-7777;Plano Musculação"
                }
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plano-padrao">Plano padrão (opcional)</Label>
              <Input
                id="plano-padrao"
                value={planoPadrao}
                onChange={(e) => setPlanoPadrao(e.target.value)}
                list="planos-da-importacao"
                className="min-h-11"
              />
              <datalist id="planos-da-importacao">
                {PLANOS_OFICIAIS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Usado nas linhas em que a planilha não informa o plano.
              </p>
            </div>

            {analise?.erroGeral ? (
              <p
                role="alert"
                className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
              >
                {analise.erroGeral}
              </p>
            ) : analise ? (
              <div className="space-y-3">
                <div role="status" className="flex flex-wrap gap-2 text-sm">
                  <Selo tom="ok">{analise.novos} novo(s)</Selo>
                  <Selo tom={analise.duplicados ? "atencao" : "neutro"}>
                    {analise.duplicados} já existe(m)
                  </Selo>
                  <Selo tom={analise.erros ? "alerta" : "neutro"}>{analise.erros} com erro</Selo>
                </div>
                <p className="text-xs text-muted-foreground">
                  Colunas lidas: {analise.colunas.map((c) => c.titulo).join(", ") || "nenhuma"}.
                  {analise.ignoradas.length > 0
                    ? ` Ignoradas: ${analise.ignoradas.join(", ")}.`
                    : ""}
                </p>
                {comProblema.length > 0 ? (
                  <div className="max-h-56 overflow-y-auto rounded-2xl border border-foreground/10">
                    <table className="w-full text-sm">
                      <caption className="sr-only">Linhas que não serão importadas</caption>
                      <thead className="bg-foreground/[0.04] text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th scope="col" className="px-3 py-2">
                            Linha
                          </th>
                          <th scope="col" className="px-3 py-2">
                            Aluno
                          </th>
                          <th scope="col" className="px-3 py-2">
                            Situação
                          </th>
                          <th scope="col" className="px-3 py-2">
                            O que fazer
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {comProblema.slice(0, 100).map((l) => (
                          <tr key={l.linha} className="border-t border-foreground/10 align-top">
                            <td className="px-3 py-2 tabular-nums">{l.linha}</td>
                            <td className="px-3 py-2">{l.nome || "—"}</td>
                            <td className="px-3 py-2">
                              <Selo tom={ROTULO_ESTADO[l.estado].tom}>
                                {ROTULO_ESTADO[l.estado].texto}
                              </Selo>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {l.mensagens.join(" ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ) : null}

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fechar(false)}
                className="min-h-11 rounded-full"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={
                  !analise || Boolean(analise.erroGeral) || analise.novos === 0 || gravar.isPending
                }
                onClick={() => gravar.mutate()}
                className="min-h-11 gap-2 rounded-full"
              >
                {gravar.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                {analise && !analise.erroGeral ? `Importar ${analise.novos} aluno(s)` : "Importar"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

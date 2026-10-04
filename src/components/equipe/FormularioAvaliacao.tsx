import { Loader2, Ruler, Save, TriangleAlert } from "lucide-react";
import { Selo, Superficie } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GRUPOS_DE_MEDIDAS, LIMITES, MEDIDAS } from "@/lib/equipe-app";
import { Campo, CampoNumerico, CLASSE_AREA_TEXTO, CLASSE_CAMPO } from "./Campos";
import { pluralizar } from "./formatar";
import type { FormAvaliacao } from "./avaliacao-form";

type Erros = Record<string, string>;

export function SecaoDadosAvaliacao({
  form,
  erros,
  hoje,
  onChange,
}: {
  form: FormAvaliacao;
  erros: Erros;
  hoje: string;
  onChange: (form: FormAvaliacao) => void;
}) {
  return (
    <Superficie as="section">
      <h2 className="font-display text-xl font-semibold">Peso e data</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Campo rotulo="Data da avaliação" erro={erros["data"]}>
          {(props) => (
            <Input
              {...props}
              type="date"
              min="2000-01-01"
              max={hoje}
              value={form.data}
              onChange={(e) => onChange({ ...form, data: e.target.value })}
              className={CLASSE_CAMPO}
            />
          )}
        </Campo>
        <CampoNumerico
          rotulo="Peso"
          unidade="kg"
          placeholder="Ex.: 72,5"
          valor={form.peso}
          onChange={(peso) => onChange({ ...form, peso })}
          erro={erros["peso"]}
        />
      </div>
    </Superficie>
  );
}

export function SecaoMedidas({
  form,
  erros,
  medidasAtivas,
  onChange,
}: {
  form: FormAvaliacao;
  erros: Erros;
  medidasAtivas: boolean;
  onChange: (form: FormAvaliacao) => void;
}) {
  return (
    <Superficie as="section">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
          <Ruler className="size-5 text-muted-foreground" aria-hidden /> Medidas corporais
        </h2>
        <Selo>Opcional</Selo>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Preencha só o que foi medido hoje. Campos em branco não são registrados.
      </p>

      {!medidasAtivas ? (
        <p className="mt-4 flex gap-3 rounded-2xl border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-3 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-brand-yellow" aria-hidden />
          <span>
            O registro de medidas ainda não foi ativado no banco de dados (migration pendente). Por
            enquanto é possível registrar apenas o peso.
          </span>
        </p>
      ) : null}

      <div className="mt-5 space-y-6">
        {GRUPOS_DE_MEDIDAS.map((grupo) => (
          <fieldset
            key={grupo.titulo}
            disabled={!medidasAtivas}
            className="min-w-0 border-0 p-0 disabled:opacity-50"
          >
            <legend className="mb-3 p-0 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {grupo.titulo}
            </legend>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {grupo.chaves.map((chave) => (
                <CampoNumerico
                  key={chave}
                  rotulo={MEDIDAS[chave].rotulo}
                  unidade={MEDIDAS[chave].unidade}
                  valor={form.medidas[chave]}
                  onChange={(valor) =>
                    onChange({ ...form, medidas: { ...form.medidas, [chave]: valor } })
                  }
                  erro={erros[chave]}
                />
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <Campo
        rotulo="Observações da avaliação"
        opcional
        dica="O aluno vê a anotação mais recente na tela de avaliações."
        erro={erros["observacoes"]}
        className="mt-6"
      >
        {(props) => (
          <Textarea
            {...props}
            maxLength={LIMITES.avaliacao.observacoes}
            placeholder="Ex.: Medidas tomadas em jejum, pela manhã"
            value={form.observacoes}
            onChange={(e) => onChange({ ...form, observacoes: e.target.value })}
            disabled={!medidasAtivas && form.observacoes === ""}
            className={CLASSE_AREA_TEXTO}
          />
        )}
      </Campo>
    </Superficie>
  );
}

/** Barra de ação fixa na base: o botão fica à mão mesmo com o formulário longo no celular. */
export function BarraRegistro({
  registrando,
  quantidadeErros,
}: {
  registrando: boolean;
  quantidadeErros: number;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex flex-col gap-3 border-t border-white/10 bg-background/90 px-4 pb-seguro pt-3 backdrop-blur sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:mx-0 lg:rounded-3xl lg:border lg:bg-card/95 lg:px-5 lg:py-3">
      <p
        role="status"
        className={
          quantidadeErros > 0
            ? "text-sm font-medium text-red-300"
            : "hidden text-sm text-muted-foreground sm:block"
        }
      >
        {quantidadeErros > 0
          ? `Revise ${pluralizar(quantidadeErros, "campo destacado", "campos destacados")} para registrar.`
          : "O peso e o IMC passam a valer também na ficha do aluno."}
      </p>
      <Button
        type="submit"
        disabled={registrando}
        className="h-12 gap-2 rounded-full bg-brand-yellow px-8 text-base font-semibold text-brand-black hover:bg-brand-yellow/90"
      >
        {registrando ? <Loader2 className="animate-spin" /> : <Save />}
        {registrando ? "Registrando…" : "Registrar avaliação"}
      </Button>
    </div>
  );
}

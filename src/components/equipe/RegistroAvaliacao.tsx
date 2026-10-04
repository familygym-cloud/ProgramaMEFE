import { ClipboardList, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EstadoVazio, PageHeader, Superficie } from "@/components/app/ui";
import { hojeBrasilia } from "@/lib/datas";
import type {
  AlunoEquipe,
  EntradaAvaliacao,
  HistoricoAvaliacoes as Historico,
  ResultadoAvaliacao,
} from "@/lib/equipe-app";
import { DialogoDescarte } from "./DialogoDescarte";
import { BarraRegistro, SecaoDadosAvaliacao, SecaoMedidas } from "./FormularioAvaliacao";
import { HistoricoAvaliacoes } from "./HistoricoAvaliacoes";
import { PreviaAvaliacao } from "./PreviaAvaliacao";
import { ResumoAlunoAvaliacao } from "./ResumoAlunoAvaliacao";
import { SeletorAluno } from "./SeletorAluno";
import {
  calcularPrevia,
  entradaDoFormAvaliacao,
  formAvaliacaoVazio,
  temConteudo,
  validarFormAvaliacao,
} from "./avaliacao-form";
import { useGuardaDescarte } from "./useGuardaDescarte";

const atraso = (ms: number) => ({ animationDelay: `${ms}ms` });

/**
 * Tela de avaliação: escolher o aluno, lançar peso e medidas com prévia do IMC e consultar o histórico.
 * A gravação (e os avisos de sucesso/erro) vêm de fora por `onRegistrar`.
 */
export function RegistroAvaliacao({
  alunos,
  alunoId,
  onEscolherAluno,
  historico,
  carregandoHistorico,
  erroHistorico,
  onRegistrar,
}: {
  alunos: readonly AlunoEquipe[];
  alunoId: string | null;
  onEscolherAluno: (alunoId: string) => void;
  historico: Historico | undefined;
  carregandoHistorico: boolean;
  erroHistorico: string | null;
  onRegistrar: (entrada: EntradaAvaliacao) => Promise<ResultadoAvaliacao>;
}) {
  const hoje = useMemo(() => hojeBrasilia(), []);
  const [form, setForm] = useState(() => formAvaliacaoVazio(hoje));
  const [tentativas, setTentativas] = useState(0);
  const [registrando, setRegistrando] = useState(false);
  const [alunoDoForm, setAlunoDoForm] = useState(alunoId);
  const raiz = useRef<HTMLFormElement>(null);
  const guarda = useGuardaDescarte(temConteudo(form));

  // Outro aluno (inclusive pelo botão "voltar"): o formulário recomeça em branco.
  if (alunoDoForm !== alunoId) {
    setAlunoDoForm(alunoId);
    setForm(formAvaliacaoVazio(hoje));
    setTentativas(0);
  }

  const aluno = alunos.find((a) => a.id === alunoId) ?? null;
  const avaliacoes = historico?.avaliacoes;
  const erros = useMemo(
    () => (tentativas > 0 ? validarFormAvaliacao(form) : {}),
    [tentativas, form],
  );
  const previa = useMemo(
    () => (aluno ? calcularPrevia(form, aluno, avaliacoes ?? []) : null),
    [form, aluno, avaliacoes],
  );

  // Falhou ao registrar: leva o foco ao primeiro campo com problema.
  useEffect(() => {
    if (tentativas === 0) return;
    const invalido = raiz.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    invalido?.focus();
    invalido?.scrollIntoView({ block: "center" });
  }, [tentativas]);

  async function registrar() {
    if (!aluno) return;
    if (Object.keys(validarFormAvaliacao(form)).length > 0) {
      setTentativas((n) => n + 1);
      return;
    }
    setRegistrando(true);
    try {
      await onRegistrar(entradaDoFormAvaliacao(form, aluno.id));
      setForm(formAvaliacaoVazio(hoje));
      setTentativas(0);
    } catch {
      // O aviso de erro já foi exibido por quem grava; o que foi digitado continua na tela.
    } finally {
      setRegistrando(false);
    }
  }

  return (
    <>
      <div className="fg-entrada">
        <PageHeader
          eyebrow="Equipe · Avaliação"
          titulo="Registrar avaliação"
          descricao="Lance o peso e as medidas do aluno. O IMC é calculado com a altura da ficha e a evolução aparece na hora na área do aluno."
        />
      </div>

      <div className="fg-entrada" style={atraso(80)}>
        <Superficie brilho className="space-y-5">
          {alunos.length === 0 ? (
            <p className="flex items-center gap-3 text-sm text-muted-foreground">
              <Users className="size-5 shrink-0" aria-hidden /> Nenhum aluno cadastrado ainda.
            </p>
          ) : (
            <SeletorAluno
              alunos={alunos}
              valor={alunoId}
              onChange={(id) => id !== alunoId && guarda.proteger(() => onEscolherAluno(id))}
            />
          )}
          {aluno ? (
            <ResumoAlunoAvaliacao
              aluno={aluno}
              ultima={historico ? (avaliacoes?.[0] ?? null) : undefined}
            />
          ) : null}
        </Superficie>
      </div>

      {!aluno || !previa ? (
        alunos.length > 0 ? (
          <div className="fg-entrada" style={atraso(160)}>
            <EstadoVazio
              icone={<ClipboardList />}
              titulo="Escolha um aluno para registrar a avaliação"
              texto="Selecione o aluno acima. Você verá a altura da ficha, a última avaliação e o histórico de peso."
            />
          </div>
        ) : null
      ) : (
        <>
          <form
            ref={raiz}
            noValidate
            aria-label={`Nova avaliação de ${aluno.nome}`}
            onSubmit={(e) => {
              e.preventDefault();
              void registrar();
            }}
            className="fg-entrada"
            style={atraso(140)}
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
              <div className="lg:col-start-1">
                <SecaoDadosAvaliacao form={form} erros={erros} hoje={hoje} onChange={setForm} />
              </div>
              <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-stretch">
                <div className="lg:sticky lg:top-28">
                  <PreviaAvaliacao
                    aluno={aluno}
                    previa={previa}
                    carregandoHistorico={carregandoHistorico}
                  />
                </div>
              </div>
              <div className="lg:col-start-1">
                <SecaoMedidas
                  form={form}
                  erros={erros}
                  medidasAtivas={historico?.medidasAtivas ?? true}
                  onChange={setForm}
                />
              </div>
            </div>
            <BarraRegistro registrando={registrando} quantidadeErros={Object.keys(erros).length} />
          </form>

          <div className="fg-entrada" style={atraso(200)}>
            <HistoricoAvaliacoes
              aluno={aluno}
              avaliacoes={avaliacoes}
              carregando={carregandoHistorico}
              erro={erroHistorico}
            />
          </div>
        </>
      )}

      <DialogoDescarte
        aberto={guarda.aberto}
        onConfirmar={guarda.confirmar}
        onCancelar={guarda.cancelar}
      />
    </>
  );
}

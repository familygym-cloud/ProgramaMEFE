import { LockKeyhole, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstadoVazio } from "@/components/app/ui";
import type { PrecosDosPlanos } from "@/lib/planos-hook";

type Indisponivel = Exclude<PrecosDosPlanos, { estado: "ok" | "carregando" }>;

/**
 * O que mostrar no lugar dos valores quando eles não chegam: conta sem plano ativo (o banco não
 * entrega as linhas), tabela ainda não cadastrada ou falha de rede.
 */
export function ValoresIndisponiveis({ precos }: { precos: Indisponivel }) {
  if (precos.estado === "bloqueado") {
    return (
      <EstadoVazio
        icone={<LockKeyhole />}
        titulo="Valores disponíveis para alunos com plano ativo"
        texto={
          precos.motivo === "inativo"
            ? "Seu cadastro está sem plano ativo no momento, por isso os valores ficam ocultos. Fale com a recepção da Family Gym para regularizar ou renovar o plano."
            : "Esta conta ainda não está vinculada a um aluno. Peça à recepção da Family Gym para fazer o vínculo."
        }
      />
    );
  }
  if (precos.estado === "erro") {
    return (
      <EstadoVazio
        icone={<WifiOff />}
        titulo="Não foi possível carregar os valores"
        texto={precos.mensagem}
        acao={<Button onClick={precos.tentarDeNovo}>Tentar de novo</Button>}
      />
    );
  }
  return (
    <EstadoVazio
      icone={<LockKeyhole />}
      titulo="Valores ainda não cadastrados"
      texto="A tabela de valores ainda não foi publicada para a sua conta. Fale com a recepção da Family Gym para consultar as condições."
    />
  );
}

import { FORMULARIO_MEFE } from "./mefe";
import { FORMULARIO_NUTRICIONAL } from "./nutricional";
import { FORMULARIO_PSICOLOGICA } from "./psicologica";
import type { DefinicaoFormulario, IdFormulario } from "./tipos";
import { IDS_FORMULARIO } from "./tipos";

const POR_ID: Readonly<Record<IdFormulario, DefinicaoFormulario>> = {
  mefe: FORMULARIO_MEFE,
  nutricional: FORMULARIO_NUTRICIONAL,
  psicologica: FORMULARIO_PSICOLOGICA,
};

export function definicaoDoFormulario(id: IdFormulario): DefinicaoFormulario {
  return POR_ID[id];
}

export function todosOsFormularios(): readonly DefinicaoFormulario[] {
  return IDS_FORMULARIO.map((id) => POR_ID[id]);
}

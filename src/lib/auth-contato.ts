/** Mensagem pronta para a recepção; cita o e-mail da conta quando ele é conhecido. */
export function mensagemParaRecepcao(email: string | null): string {
  return email
    ? `Olá! Criei minha conta na área do aluno com o e-mail ${email} e preciso que a recepção vincule ao meu cadastro de aluno.`
    : "Olá! Criei minha conta na área do aluno e preciso que a recepção vincule ao meu cadastro de aluno.";
}

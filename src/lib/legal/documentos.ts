// Textos das páginas de Privacidade e Termos de uso. São um RASCUNHO bem fundamentado na Lei Geral de
// Proteção de Dados (LGPD, Lei 13.709/2018) e no que o sistema realmente faz, mas NÃO substituem a
// revisão de um advogado: os dados de saúde que a academia trata são "sensíveis" (art. 11) e exigem
// cuidado. Enquanto REVISAO_JURIDICA_PENDENTE for `true`, as páginas mostram um aviso de rascunho.

export const REVISAO_JURIDICA_PENDENTE = true;

export const ATUALIZADO_EM = "outubro de 2026";

export const RAZAO_SOCIAL = "Academia Family Gym";
export const CNPJ_DA_ACADEMIA = "63.973.843/0001-94";

export type Bloco = { tipo: "p"; texto: string } | { tipo: "lista"; itens: string[] };

export type SecaoLegal = { id: string; titulo: string; blocos: Bloco[] };

const p = (texto: string): Bloco => ({ tipo: "p", texto });
const lista = (...itens: string[]): Bloco => ({ tipo: "lista", itens });

export const POLITICA_DE_PRIVACIDADE: SecaoLegal[] = [
  {
    id: "quem-somos",
    titulo: "Quem é o responsável pelos seus dados",
    blocos: [
      p(
        `A ${RAZAO_SOCIAL} (CNPJ ${CNPJ_DA_ACADEMIA}) é a controladora dos dados pessoais tratados neste site e na área do aluno. Esta política explica quais dados coletamos, para quê, com quem os compartilhamos e quais são os seus direitos, conforme a LGPD.`,
      ),
    ],
  },
  {
    id: "dados",
    titulo: "Quais dados coletamos",
    blocos: [
      lista(
        "Cadastro: nome, e-mail, telefone, data de nascimento ou idade, plano e data de matrícula.",
        "Conta de acesso: e-mail, senha (guardada de forma protegida, nunca em texto aberto) e, se ativada, a verificação em duas etapas.",
        "Dados de saúde e condicionamento físico (dados sensíveis): peso, altura, IMC, medidas corporais, bioimpedância, avaliações físicas, observações da equipe, metas e respostas dos formulários do Programa MEFE (musculação, avaliação nutricional e psicológica).",
        "Rotina de treino: fichas de treino, treinos registrados, reservas e presenças em aulas.",
        "Acesso à academia: registros de entrada na catraca ou controle de acesso, quando integrados.",
        "Financeiro: mensalidades, vencimentos e pagamentos (não guardamos dados de cartão).",
        "Dados técnicos: endereço de IP e registros de acesso necessários à segurança do sistema.",
      ),
    ],
  },
  {
    id: "para-que",
    titulo: "Para que usamos e em que base legal",
    blocos: [
      lista(
        "Prestar o serviço contratado (matrícula, treinos, aulas, reservas, cobrança): execução de contrato.",
        "Acompanhar a sua evolução física e orientar o treino, a nutrição e o acompanhamento multidisciplinar: tutela da saúde e, quando exigido, o seu consentimento específico.",
        "Cumprir obrigações legais e fiscais: obrigação legal ou regulatória.",
        "Garantir a segurança do sistema e prevenir fraudes: legítimo interesse.",
        "Enviar avisos sobre a sua conta e as suas aulas: execução de contrato e legítimo interesse.",
      ),
      p("Não vendemos os seus dados e não os usamos para publicidade de terceiros."),
    ],
  },
  {
    id: "compartilhamento",
    titulo: "Com quem compartilhamos",
    blocos: [
      p("Compartilhamos dados apenas na medida necessária para operar o serviço, com:"),
      lista(
        "Provedores de infraestrutura: hospedagem do site e banco de dados (Cloudflare e Supabase) e envio de e-mails.",
        "Sistemas de gestão e controle de acesso contratados pela academia, quando você é cadastrado neles.",
        "Autoridades públicas, quando houver obrigação legal.",
      ),
      p(
        "Dentro da academia, o acesso é limitado por perfil: a recepção não vê as avaliações físicas e o professor não vê dados financeiros.",
      ),
    ],
  },
  {
    id: "guarda",
    titulo: "Por quanto tempo guardamos",
    blocos: [
      p(
        "Guardamos os dados enquanto você for aluno e pelo prazo necessário para cumprir obrigações legais e exercer direitos em eventual disputa. Depois disso, os dados são apagados ou anonimizados. Os formulários do Programa MEFE preenchidos pela equipe não ficam gravados no sistema: existem apenas na tela, para impressão ou arquivo da ficha.",
      ),
    ],
  },
  {
    id: "direitos",
    titulo: "Os seus direitos",
    blocos: [
      p("Você pode, a qualquer momento e gratuitamente, pedir:"),
      lista(
        "confirmação de que tratamos os seus dados e acesso a eles;",
        "correção de dados incompletos, inexatos ou desatualizados;",
        "anonimização, bloqueio ou eliminação de dados desnecessários;",
        "portabilidade dos dados;",
        "informação sobre com quem compartilhamos;",
        "revogação do consentimento, quando o tratamento se basear nele.",
      ),
      p(
        "Para exercer esses direitos, fale com a recepção pelos canais de contato desta página. Responderemos no prazo da lei.",
      ),
    ],
  },
  {
    id: "menores",
    titulo: "Crianças e adolescentes",
    blocos: [
      p(
        "Os dados de menores de 18 anos (como os do plano Kids) são tratados no melhor interesse deles e com o consentimento de um dos pais ou responsável legal, que pode exercer os direitos acima em nome da criança.",
      ),
    ],
  },
  {
    id: "seguranca",
    titulo: "Como protegemos os seus dados",
    blocos: [
      lista(
        "Acesso por conta pessoal, com confirmação de e-mail e verificação em duas etapas (obrigatória para a equipe).",
        "Regras de acesso no banco de dados: cada pessoa só vê o que o seu perfil permite.",
        "Comunicação criptografada (HTTPS) e senhas protegidas.",
        "Chaves de integração com permissões limitadas e revogáveis.",
      ),
      p(
        "Nenhum sistema é totalmente imune a falhas; se houver um incidente que possa causar risco relevante, avisaremos você e a autoridade competente, como manda a lei.",
      ),
    ],
  },
  {
    id: "cookies",
    titulo: "Cookies e armazenamento no navegador",
    blocos: [
      p(
        "Usamos apenas o armazenamento essencial do navegador: manter a sua sessão de login, lembrar preferências simples (como um aviso já lido) e guardar, no seu aparelho, o treino do dia para uso sem internet. Não usamos cookies de publicidade nem ferramentas de rastreamento de terceiros. Ao sair da conta, os dados de treino guardados no aparelho são apagados.",
      ),
    ],
  },
  {
    id: "contato",
    titulo: "Contato e atualizações",
    blocos: [
      p(
        "Dúvidas ou pedidos sobre privacidade: fale com a recepção da academia. Podemos atualizar esta política; a data da última atualização aparece no topo da página e mudanças relevantes serão avisadas.",
      ),
    ],
  },
];

export const TERMOS_DE_USO: SecaoLegal[] = [
  {
    id: "aceite",
    titulo: "Aceite e quem pode usar",
    blocos: [
      p(
        `Ao criar uma conta ou usar o site e a área do aluno da ${RAZAO_SOCIAL}, você concorda com estes termos e com a Política de Privacidade. Menores de 18 anos devem usar o serviço com o conhecimento e a autorização de um responsável.`,
      ),
    ],
  },
  {
    id: "conta",
    titulo: "Sua conta",
    blocos: [
      lista(
        "Informe dados verdadeiros e mantenha o contato atualizado.",
        "A conta é pessoal: não compartilhe a senha. Você é responsável pelo que for feito com ela.",
        "A conta só dá acesso aos dados de aluno depois de vinculada à sua ficha na academia, o que pode ocorrer automaticamente ou pela recepção.",
        "Podemos suspender contas usadas de forma indevida ou que ponham em risco a segurança do sistema.",
      ),
    ],
  },
  {
    id: "saude",
    titulo: "Saúde e orientação de treino",
    blocos: [
      p(
        "As informações do site e do aplicativo (treinos, avaliações, resultados, metas e conteúdo do Programa MEFE) têm caráter educativo e de acompanhamento. Elas não substituem avaliação, diagnóstico ou orientação de médico, nutricionista ou psicólogo. Informe à equipe qualquer condição de saúde, lesão ou restrição e procure atendimento médico antes de iniciar ou retomar atividades, principalmente se tiver sintomas ou doenças preexistentes.",
      ),
    ],
  },
  {
    id: "aulas",
    titulo: "Aulas, reservas e lista de espera",
    blocos: [
      lista(
        "As reservas dependem da disponibilidade de vagas. Quando a aula está lotada, você pode entrar na lista de espera e entra automaticamente se uma vaga abrir.",
        "Se não puder comparecer, cancele a reserva para liberar a vaga a outra pessoa.",
        "A grade de aulas e a capacidade podem mudar por decisão da academia.",
      ),
    ],
  },
  {
    id: "pagamentos",
    titulo: "Planos e pagamentos",
    blocos: [
      p(
        "Os valores dos planos são informados na área do aluno e pela recepção e podem ser alterados. O pagamento por Pix gerado no aplicativo é só uma facilidade: a parcela passa a constar como paga quando a recepção confirmar o recebimento. Condições de matrícula, trancamento e cancelamento seguem o contrato firmado com a academia.",
      ),
    ],
  },
  {
    id: "uso",
    titulo: "Uso adequado",
    blocos: [
      lista(
        "Não tente acessar dados de outras pessoas, burlar controles de segurança ou sobrecarregar o sistema.",
        "Não use o serviço para fins ilegais.",
        "Os textos, a marca, as imagens e o conteúdo do Programa MEFE pertencem à academia ou a quem a licenciou e não podem ser copiados sem autorização.",
      ),
    ],
  },
  {
    id: "disponibilidade",
    titulo: "Disponibilidade e responsabilidade",
    blocos: [
      p(
        "Trabalhamos para manter o serviço no ar, mas ele pode ficar indisponível por manutenção ou por fatores fora do nosso controle. A academia não responde por danos decorrentes de uso indevido da conta ou de informações incorretas fornecidas pelo usuário, nos limites da lei.",
      ),
    ],
  },
  {
    id: "mudancas",
    titulo: "Mudanças, lei aplicável e contato",
    blocos: [
      p(
        "Podemos atualizar estes termos; a versão em vigor é a publicada nesta página. Aplica-se a lei brasileira e fica eleito o foro da comarca de São Paulo, SP, ressalvados os direitos do consumidor. Dúvidas: fale com a recepção.",
      ),
    ],
  },
];

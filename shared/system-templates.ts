export interface SystemTemplate {
  id: string
  name: string
  description: string
  subject: string
  body: string
}

export const SYSTEM_TEMPLATES: SystemTemplate[] = [
  {
    id: 'system-standard',
    name: 'Convite padrão',
    description: 'Convite padrão para entrevista',
    subject: 'Convite para entrevista: {{jobTitle}} em {{organizationName}}',
    body: `Olá {{candidateName}},

    Temos o prazer de convidá-lo(a) para uma entrevista para a posição de {{jobTitle}} na {{organizationName}}.

    Detalhes da entrevista:
    - Data: {{interviewDate}}
    - Horário: {{interviewTime}}
    - Duração: {{interviewDuration}} minutos
    - Tipo: {{interviewType}}
    - Local: {{interviewLocation}}

    Entrevistadores: {{interviewers}}

    Por favor, confirme sua disponibilidade respondendo a este e-mail. Caso precise reagendar, avise-nos o quanto antes.

    Esperamos falar com você!

    Atenciosamente,
    {{organizationName}}`,
  },
  {
    id: 'system-friendly',
    name: 'Convite amigável e casual',
    description: 'Convite amigável e casual para entrevista',
    subject: "Vamos falar! Entrevista para {{jobTitle}}",
    body: `Olá {{candidateFirstName}},

    Ótima notícia — gostaríamos muito de conversar com você sobre a vaga de {{jobTitle}} na {{organizationName}}!

    Aqui estão os detalhes:
    - Quando: {{interviewDate}} às {{interviewTime}} ({{interviewDuration}} min)
    - Como: {{interviewType}}
    - Onde: {{interviewLocation}}

    Você conversará com: {{interviewers}}

    Se esse horário não funcionar para você, é só nos avisar e encontraremos outro que funcione.

    Estamos ansiosos para conversar!

    Equipe {{organizationName}}`,
  },
  {
    id: 'system-technical',
    name: 'Entrevista técnica',
    description: 'Convite para entrevista técnica com informações de preparação para candidatos',
    subject: 'Convite para entrevista técnica: {{jobTitle}} em {{organizationName}}',
    body: `Olá {{candidateName}},

    Obrigado pelo seu interesse na vaga de {{jobTitle}} na {{organizationName}}. Gostaríamos de convidá-lo(a) para uma entrevista técnica.

    Detalhes da entrevista:
    - Título: {{interviewTitle}}
    - Data: {{interviewDate}}
    - Horário: {{interviewTime}}
    - Duração: {{interviewDuration}} minutos
    - Formato: {{interviewType}}
    - Local: {{interviewLocation}}

    Seu(s) entrevistador(es): {{interviewers}}

    Para ajudar na sua preparação:
    - Esteja pronto(a) para discutir sua experiência técnica e abordagem de resolução de problemas
    - Você pode ser solicitado(a) a escrever ou revisar código durante a sessão
    - Sinta-se à vontade para fazer perguntas sobre nossa stack tecnológica e práticas de desenvolvimento

    Por favor, confirme sua participação respondendo a este e-mail.

    Atenciosamente,
    {{organizationName}}`,
  },
]

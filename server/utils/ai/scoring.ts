/**
 * AI Scoring Engine
 *
 * Evaluates candidates against job-specific scoring criteria using LLMs.
 * Produces structured, evidence-based scores with confidence ratings.
 */
import { z } from 'zod'
import { generateStructuredOutput, type ProviderConfig } from './provider'

// ─── Scoring Output Schema ────────────────────────────────────────

/** Schema for a single criterion evaluation from the LLM */
const criterionEvaluationSchema = z.object({
  criterionKey: z.string(),
  maxScore: z.number().int().min(0),
  applicantScore: z.number().int().min(0),
  confidence: z.number().min(0).max(100).int(),
  evidence: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
})

/** Full scoring response from the LLM */
const scoringResponseSchema = z.object({
  evaluations: z.array(criterionEvaluationSchema),
  summary: z.string(),
})

export type CriterionEvaluation = z.infer<typeof criterionEvaluationSchema>
export type ScoringResponse = z.infer<typeof scoringResponseSchema>

// ─── Criterion Definition ─────────────────────────────────────────

export interface CriterionDefinition {
  key: string
  name: string
  description: string | null
  category: string
  maxScore: number
  weight: number
}

const BRAZILIAN_PORTUGUESE_SCORING_RULES = `REGRAS OBRIGATÓRIAS DE IDIOMA:
- Retorne TODO o conteúdo textual em português do Brasil (pt-BR)
- "summary", "evidence", cada item de "strengths" e cada item de "gaps" devem estar em pt-BR
- Nunca misture inglês e português na redacão da análise
- Se o currículo estiver em inglês, traduza a análise para pt-BR
- Preserve em inglês apenas nomes próprios, siglas, tecnologias, certificacões, cargos e empresas quando isso for necessário para fidelidade ao material
- Não use frases genéricas em inglês como "Strong fit", "Good communication" ou "Missing evidence"`

// ─── Pre-made Criteria Templates ──────────────────────────────────

export const PREMADE_CRITERIA: Record<string, CriterionDefinition[]> = {
  standard: [
    {
      key: 'technical_skills',
      name: 'Technical Skills',
      description: 'Evaluate the candidate\'s technical competencies, tools, programming languages, and frameworks mentioned in their resume against the job requirements.',
      category: 'technical',
      maxScore: 10,
      weight: 50,
    },
    {
      key: 'relevant_experience',
      name: 'Relevant Experience',
      description: 'Assess years and quality of experience directly relevant to the role. Consider industry, company size, and scope of responsibilities.',
      category: 'experience',
      maxScore: 10,
      weight: 50,
    },
    {
      key: 'education_fit',
      name: 'Education & Certifications',
      description: 'Evaluate educational background and professional certifications relevant to the position requirements.',
      category: 'education',
      maxScore: 10,
      weight: 30,
    },
  ],
  technical: [
    {
      key: 'core_tech_stack',
      name: 'Core Tech Stack Match',
      description: 'How well the candidate\'s technical skills match the primary technologies required for this role.',
      category: 'technical',
      maxScore: 10,
      weight: 70,
    },
    {
      key: 'system_design',
      name: 'System Design & Architecture',
      description: 'Evidence of system design experience, scalability thinking, and architectural decision-making.',
      category: 'technical',
      maxScore: 10,
      weight: 50,
    },
    {
      key: 'engineering_practices',
      name: 'Engineering Practices',
      description: 'Testing, CI/CD, code review, documentation, and software development lifecycle experience.',
      category: 'technical',
      maxScore: 10,
      weight: 40,
    },
    {
      key: 'relevant_experience',
      name: 'Relevant Experience',
      description: 'Years and depth of experience in similar roles, projects, or domains.',
      category: 'experience',
      maxScore: 10,
      weight: 50,
    },
  ],
  non_technical: [
    {
      key: 'relevant_experience',
      name: 'Relevant Experience',
      description: 'Depth and breadth of experience directly applicable to the role responsibilities.',
      category: 'experience',
      maxScore: 10,
      weight: 60,
    },
    {
      key: 'domain_knowledge',
      name: 'Domain Knowledge',
      description: 'Relevant industry or domain expertise that demonstrates understanding of the business context.',
      category: 'experience',
      maxScore: 10,
      weight: 40,
    },
    {
      key: 'education_fit',
      name: 'Education & Certifications',
      description: 'Educational background and certifications relevant to the position.',
      category: 'education',
      maxScore: 10,
      weight: 30,
    },
  ],
}

// ─── Rubric Generation from Job Description ───────────────────────

const generatedCriteriaSchema = z.object({
  criteria: z.array(z.object({
    key: z.string(),
    name: z.string(),
    description: z.string(),
    category: z.enum(['technical', 'experience', 'education', 'custom']),
    maxScore: z.number().int().min(1).max(10).describe('Always use 10'),
    suggestedWeight: z.number().int().min(10).max(100),
  })),
})

/**
 * Use AI to generate scoring criteria from a job description.
 * Returns 4–6 criteria tailored to the specific role.
 */
export async function generateCriteriaFromDescription(
  config: ProviderConfig,
  jobTitle: string,
  jobDescription: string,
): Promise<CriterionDefinition[]> {
  const result = await generateStructuredOutput(config, {
    system: `Você é um(a) especialista em RH focado(a) em criar critérios objetivos e sem viés para avaliação de candidatos.
Sua tarefa é analisar uma descrição de vaga e criar de 4 a 6 critérios mensuráveis de pontuação.

Regras:
- Retorne TODO o conteúdo textual em português do Brasil (pt-BR)
- "name" e "description" devem estar em pt-BR, claros e profissionais
- Cada critério deve ser específico e mensurável a partir de currículo/CV
- Evite critérios que possam introduzir viés (idade, gênero, etnia, deficiência)
- Não crie critérios de soft skills/cultura (ex.: comunicação, liderança, cultura fit, comportamento); foque apenas em hard skills e evidências verificáveis no currículo
- Foque em habilidades, experiência e qualificações diretamente relevantes para a função
- Cada "key" deve ser única, em minúsculas, ASCII e com underscores (ex.: "react_expertise")
- "category" deve ser uma destas: "technical", "experience", "education" ou "custom"
- Defina "suggestedWeight" maior para critérios mais críticos (escala 10–100)`,
    prompt: `Job Title: ${jobTitle}\n\nJob Description:\n${jobDescription}`,
    schema: generatedCriteriaSchema,
    schemaName: 'GeneratedCriteria',
    schemaDescription: 'Scoring criteria generated from job description',
  })

  return result.object.criteria.map(c => ({
    key: c.key,
    name: c.name,
    description: c.description,
    category: c.category,
    maxScore: c.maxScore,
    weight: c.suggestedWeight,
  }))
}

// ─── Score Application ────────────────────────────────────────────

/**
 * Score a single application against the job's scoring criteria.
 * Returns structured evaluations for each criterion.
 */
export async function scoreApplication(
  config: ProviderConfig,
  params: {
    jobTitle: string
    jobDescription: string
    criteria: CriterionDefinition[]
    resumeText: string
    coverLetterText?: string | null
    applicationNotes?: string | null
  },
): Promise<{ scoring: ScoringResponse; usage: { promptTokens: number; completionTokens: number } }> {
  const criteriaBlock = params.criteria
    .map((c, i) => `${i + 1}. **${c.name}** (chave: "${c.key}", máximo: ${c.maxScore})\n   ${c.description ?? 'Sem descrição fornecida.'}`)
    .join('\n\n')

  const candidateInfo = [
    `CURRICULO:\n${params.resumeText}`,
    params.coverLetterText ? `\nCARTA DE APRESENTACAO:\n${params.coverLetterText}` : '',
    params.applicationNotes ? `\nOBSERVACOES DA CANDIDATURA:\n${params.applicationNotes}` : '',
  ].filter(Boolean).join('\n')

  const result = await generateStructuredOutput(config, {
    system: `Voce é um avaliador especialista, objetivo e imparcial de um sistema de recrutamento.
Sua tarefa é avaliar um candidato contra critérios específicos de pontuação para uma vaga.

${BRAZILIAN_PORTUGUESE_SCORING_RULES}

REGRAS IMPORTANTES:
- Pontue SOMENTE com base em evidências encontradas nos materiais fornecidos (currículo, carta de apresentação e observações)
- Se faltar informação para um critério, atribua nota baixa e registre claramente a lacuna em "gaps"
- Seja justo e consistente; evite viés com base em nome, gênero, idade, origem ou contexto pessoal
- "confidence" deve refletir o quanto de informação relevante estava disponível (0-100)
- "evidence" deve citar detalhes especificos extraídos dos materiais do candidato
- Cada item de "strengths" e "gaps" deve ser uma afirmação única, objetiva e específica
- "applicantScore" nunca pode ultrapassar "maxScore" em cada critério
- "summary" deve ser um resumo breve, profissional e em pt-BR da avaliação geral`,
    prompt: `TITULO DA VAGA: ${params.jobTitle}

DESCRICAO DA VAGA:
${params.jobDescription}

CRITERIOS DE PONTUACAO:
${criteriaBlock}

MATERIAIS DO(A) CANDIDATO(A):
${candidateInfo}

Avalie esta candidatura em cada critério e retorne a avaliação estruturada.
Lembre-se: todos os insights, diagnósticos, evidências, pontos fortes, lacunas e o resumo final devem estar em português do Brasil.`,
    schema: scoringResponseSchema,
    schemaName: 'CandidateScoring',
    schemaDescription: 'Avaliação estruturada de candidatura com pontuações por critério em português do Brasil',
  })

  // Clamp applicantScore to maxScore — LLMs may occasionally exceed the maximum
  for (const evaluation of result.object.evaluations) {
    evaluation.applicantScore = Math.min(evaluation.applicantScore, evaluation.maxScore)
  }

  return {
    scoring: result.object,
    usage: result.usage,
  }
}

/**
 * Compute a weighted composite score (0–100) from individual criterion scores.
 */
export function computeCompositeScore(
  criteria: CriterionDefinition[],
  evaluations: CriterionEvaluation[],
): number {
  let totalWeightedScore = 0
  let totalWeight = 0

  for (const criterion of criteria) {
    const evaluation = evaluations.find(e => e.criterionKey === criterion.key)
    if (!evaluation) continue

    const normalizedScore = (evaluation.applicantScore / evaluation.maxScore) * 100
    totalWeightedScore += normalizedScore * criterion.weight
    totalWeight += criterion.weight
  }

  if (totalWeight === 0) return 0
  return Math.round(totalWeightedScore / totalWeight)
}

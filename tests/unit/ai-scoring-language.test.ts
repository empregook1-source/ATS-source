import { beforeEach, describe, expect, it, vi } from 'vitest'

const { generateStructuredOutput } = vi.hoisted(() => ({
  generateStructuredOutput: vi.fn(),
}))

vi.mock('../../server/utils/ai/provider', () => ({
  generateStructuredOutput,
}))

import { scoreApplication } from '../../server/utils/ai/scoring'

describe('scoreApplication language instructions', () => {
  beforeEach(() => {
    generateStructuredOutput.mockReset()
    generateStructuredOutput.mockResolvedValue({
      object: {
        evaluations: [{
          criterionKey: 'experiencia_relevante',
          maxScore: 10,
          applicantScore: 8,
          confidence: 90,
          evidence: 'Possui experiencia direta com as responsabilidades descritas.',
          strengths: ['Atuou em projetos similares.'],
          gaps: ['Nao ha evidencia de lideranca formal.'],
        }],
        summary: 'Boa aderencia geral aos criterios avaliados.',
      },
      usage: {
        promptTokens: 100,
        completionTokens: 50,
      },
    })
  })

  it('solicita insights e diagnosticos em portugues do Brasil', async () => {
    await scoreApplication(
      {
        provider: 'openai',
        model: 'gpt-4.1-mini',
        apiKeyEncrypted: 'encrypted-key',
        maxTokens: 1024,
      },
      {
        jobTitle: 'Pessoa Desenvolvedora Frontend',
        jobDescription: 'Responsavel por construir interfaces em Vue e Nuxt.',
        criteria: [{
          key: 'experiencia_relevante',
          name: 'Experiencia Relevante',
          description: 'Avalia a aderencia da experiencia profissional a funcao.',
          category: 'experience',
          maxScore: 10,
          weight: 50,
        }],
        resumeText: 'Experiencia com Vue, Nuxt e TypeScript por 4 anos.',
        coverLetterText: 'Tenho interesse na vaga e experiencia no segmento.',
        applicationNotes: 'Indicacao interna.',
      },
    )

    expect(generateStructuredOutput).toHaveBeenCalledTimes(1)

    const [, options] = generateStructuredOutput.mock.calls[0]

    expect(options.system).toContain('portugues do Brasil (pt-BR)')
    expect(options.system).toContain('"summary", "evidence"')
    expect(options.system).toContain('Nunca misture ingles e portugues')
    expect(options.prompt).toContain('TITULO DA VAGA')
    expect(options.prompt).toContain('CRITERIOS DE PONTUACAO')
    expect(options.prompt).toContain('MATERIAIS DO(A) CANDIDATO(A)')
    expect(options.prompt).toContain('todos os insights, diagnosticos, evidencias, pontos fortes, lacunas e o resumo final devem estar em portugues do Brasil')
    expect(options.prompt).not.toContain('JOB TITLE:')
    expect(options.prompt).not.toContain('COVER LETTER:')
  })
})

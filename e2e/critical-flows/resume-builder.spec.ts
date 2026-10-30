import { test, expect } from '../fixtures'

test.describe('Resume Builder Flow', () => {
  test('candidate can complete the 6-step resume builder wizard', async ({ page }) => {
    await page.goto('/curriculo/criar')
    await expect(page.getByText('Olá, bem vindo(a).')).toBeVisible()

    await page.getByLabel('Nome completo').fill('Maria da Silva')
    await page.getByLabel('Email').fill('maria.silva@test.local')
    await page.getByLabel('Telefone').fill('11912345678')

    await page.getByRole('button', { name: 'Próximo' }).click()
    await expect(page.getByText('Vamos agora cadastrar sua formação escolar:')).toBeVisible()

    await page.getByLabel('Título').first().fill('Ensino médio')
    await page.getByLabel('Escola').first().fill('Escola Estadual Central')
    await page.getByLabel('Ano de conclusão').first().fill('2020')

    await page.getByRole('button', { name: 'Adicionar formação' }).click()
    await page.getByLabel('Título').nth(1).fill('Ensino fundamental')
    await page.getByLabel('Escola').nth(1).fill('Escola Municipal')
    await page.getByLabel('Ano de conclusão').nth(1).fill('2017')

    await page.getByRole('button', { name: 'Próximo' }).click()
    await expect(page.getByText('Vamos agora cadastrar sua formação acadêmica, seus cursos:')).toBeVisible()

    await page.getByLabel('Título').first().fill('Curso de Excel')
    await page.getByLabel('Instituição').first().fill('SENAI')
    await page.getByLabel('Conclusão').first().fill('12/2023')

    await page.getByRole('button', { name: 'Próximo' }).click()
    await expect(page.getByText('Vamos agora cadastrar sua formação profissional')).toBeVisible()

    await page.getByLabel('Título').first().fill('Auxiliar administrativo')
    await page.getByLabel('Empresa').first().fill('Empresa X')
    await page.getByLabel('Cidade').first().fill('Belém/PA')
    await page.getByLabel('Início').first().fill('01/2022')
    await page.getByLabel('Fim').first().fill('12/2023')
    await page.getByLabel('Atividades exercidas').first().fill('Atendimento ao cliente e organização de documentos.')

    await page.getByRole('button', { name: 'Próximo' }).click()
    await expect(page.getByText('Agora me conte quais suas habilidades se destacam em você!')).toBeVisible()

    await page.getByLabel('Habilidade').first().fill('Comunicação')
    await page.getByRole('button', { name: 'Próximo' }).click()

    await expect(page.getByText('Pronto, finalizamos!')).toBeVisible()
    await page.getByTestId('resume-accept-terms').check()

    const [pdfResponse] = await Promise.all([
      page.waitForResponse((response) => {
        return response.url().includes('/api/resume/pdf')
          && response.request().method() === 'POST'
      }),
      page.getByRole('button', { name: 'Baixar currículo em PDF' }).click(),
    ])

    expect(pdfResponse.ok()).toBeTruthy()
    expect(pdfResponse.headers()['content-type']).toContain('application/pdf')
  })
})

<script setup lang="ts">
import { RESUME_TERMS_VERSION } from '~~/shared/resume'

definePageMeta({
  layout: 'public',
})

useSeoMeta({
  title: 'Termos de Uso e Política de Privacidade — Criador de Currículo — Emprego OK',
  robots: 'noindex, nofollow',
})

const company = {
  name: 'Emprego OK',
  legalName: 'J G BEZERRA DE SOUZA SOLUCOES DE RH',
  cnpj: '62.154.108/0001-96',
  dpoName: 'Equipe Emprego OK',
  privacyEmail: 'empregook1@gmail.com',
  forum: 'Capitão Poço/PA',
  effectiveDate: '28/10/2026',
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10 sm:px-6">
    <article class="space-y-6 text-sm leading-relaxed text-surface-700 dark:text-surface-300">
      <header>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">
          Termo de Uso e Política de Privacidade — Criador de Currículo Emprego OK
        </h1>
        <p class="mt-2 font-semibold">
          Versão {{ RESUME_TERMS_VERSION }} — vigente a partir de {{ company.effectiveDate }}
        </p>
      </header>

      <section>
        <h2 class="mb-2 text-base font-semibold text-surface-900 dark:text-surface-100">1. Quem somos</h2>
        <p>
          A ferramenta é oferecida pela <strong>{{ company.name }}</strong> ({{ company.legalName }}, CNPJ {{ company.cnpj }}),
          que atua como <strong>controladora</strong> dos dados pessoais, nos termos da Lei nº 13.709/2018 (LGPD).
        </p>
        <p class="mt-2">
          Encarregado de dados (DPO): <strong>{{ company.dpoName }}</strong> — e-mail: <strong>{{ company.privacyEmail }}</strong>.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-surface-900 dark:text-surface-100">2. O serviço</h2>
        <p>
          O Criador de Currículo é gratuito e permite montar e baixar um currículo em PDF.
          O uso da ferramenta não garante contratação nem participação em processos seletivos.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-surface-900 dark:text-surface-100">3. Dados coletados</h2>
        <ul class="list-disc space-y-1 pl-5">
          <li><strong>Informados por você:</strong> nome, idade, cidade, telefone, e-mail, CNH, foto (opcional), formação, cursos e experiências profissionais.</li>
          <li><strong>Coletados automaticamente:</strong> endereço IP, data e hora de acesso, navegador e a versão deste termo aceita.</li>
        </ul>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-surface-900 dark:text-surface-100">4. Para que usamos os dados e com que base legal</h2>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="border-b border-surface-200 dark:border-surface-800">
                <th class="py-2 pr-4 font-semibold">Finalidade</th>
                <th class="py-2 font-semibold">Base legal (art. 7º da LGPD)</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-surface-100 dark:border-surface-800">
                <td class="py-2 pr-4">Gerar o seu currículo em PDF</td>
                <td class="py-2">Execução do serviço solicitado por você (inciso V)</td>
              </tr>
              <tr class="border-b border-surface-100 dark:border-surface-800">
                <td class="py-2 pr-4">Armazenar o seu currículo e enviar por e-mail vagas, cursos e novidades compatíveis com o seu perfil</td>
                <td class="py-2"><strong>Consentimento</strong>, que é opcional (inciso I)</td>
              </tr>
              <tr>
                <td class="py-2 pr-4">Registrar o seu aceite (IP, data/hora, versão do termo)</td>
                <td class="py-2">Cumprimento de obrigação legal e exercício regular de direitos (incisos II e VI; art. 8º, §2º)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-2">
          <strong>Sem o consentimento opcional, o seu currículo não fica armazenado.</strong> Ele é gerado só para o seu download.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-surface-900 dark:text-surface-100">5. Compartilhamento</h2>
        <p>
          Não vendemos seus dados. Eles podem ser tratados por fornecedores que nos ajudam a prestar o serviço,
          como hospedagem e envio de e-mails, sempre sob dever de sigilo e segurança. Também podem ser fornecidos
          a autoridades, quando a lei exigir. Qualquer outro compartilhamento, por exemplo com empresas recrutadoras,
          dependerá de um novo consentimento seu.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-surface-900 dark:text-surface-100">6. Armazenamento e segurança</h2>
        <p>
          Os dados ficam em servidores com controle de acesso e medidas técnicas de proteção. Ficam guardados enquanto
          o seu consentimento estiver valendo ou por até <strong>24 meses sem atualização</strong>, e depois são eliminados.
          O registro do aceite é guardado pelo prazo necessário para comprovar o consentimento.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-surface-900 dark:text-surface-100">7. Seus direitos (art. 18 da LGPD)</h2>
        <p>A qualquer momento, e sem custo, você pode pedir:</p>
        <ul class="mt-2 list-disc space-y-1 pl-5">
          <li>confirmação de que tratamos seus dados, e acesso a eles;</li>
          <li>correção de dados incompletos ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados;</li>
          <li>portabilidade dos dados;</li>
          <li>informação sobre com quem compartilhamos seus dados;</li>
          <li><strong>revogação do consentimento</strong>.</li>
        </ul>
        <p class="mt-2">
          Faça o pedido pelo e-mail <strong>{{ company.privacyEmail }}</strong>. Respondemos em até <strong>15 dias</strong>.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-surface-900 dark:text-surface-100">8. Cancelamento dos e-mails</h2>
        <p>
          Todo e-mail enviado tem um link para cancelar o recebimento. Ao cancelar, o consentimento é revogado
          e o seu currículo é eliminado.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-surface-900 dark:text-surface-100">9. Suas responsabilidades</h2>
        <p>
          Você declara que as informações são verdadeiras e que são suas. Se tiver menos de 18 anos,
          use a ferramenta com conhecimento do seu responsável legal.
        </p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-surface-900 dark:text-surface-100">10. Alterações</h2>
        <p>Se este termo mudar, uma nova versão será publicada e um novo aceite será pedido.</p>
      </section>

      <section>
        <h2 class="mb-2 text-base font-semibold text-surface-900 dark:text-surface-100">11. Lei e foro</h2>
        <p>Este termo segue a legislação brasileira. Fica eleito o foro da comarca de <strong>{{ company.forum }}</strong>.</p>
      </section>
    </article>
  </div>
</template>

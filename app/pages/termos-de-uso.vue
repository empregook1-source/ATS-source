<script setup lang="ts">
definePageMeta({
  layout: 'public',
})

const updatedAt = '19 de maio de 2026'

useSeoMeta({
  title: 'Termos de uso',
  description:
    'Leia os termos de uso da Emprego OK para utilização da plataforma, publicação de vagas e candidatura.',
  ogTitle: 'Termos de uso - Emprego OK',
  ogDescription:
    'Leia os termos de uso da Emprego OK para utilização da plataforma, publicação de vagas e candidatura.',
  ogType: 'website',
})
</script>

<template>
  <article class="space-y-8 text-surface-700 dark:text-surface-300">
    <header class="space-y-3">
      <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100">
        Termos de uso
      </h1>
      <p class="text-sm text-surface-500 dark:text-surface-400">
        Atualizado em: {{ updatedAt }}
      </p>
      <p class="leading-7">
        Estes Termos de Uso regulam o acesso e a utilização da plataforma Emprego OK por candidatos,
        empresas, recrutadores, parceiros e demais usuários. Ao navegar, criar conta, publicar vaga,
        enviar candidatura ou utilizar qualquer funcionalidade da plataforma, o usuário declara que leu,
        compreendeu e concorda com estas condições.
      </p>
    </header>

    <section class="space-y-3">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100">
        1. Objetivo da plataforma
      </h2>
      <p class="leading-7">
        A Emprego OK oferece recursos para divulgação de vagas, recebimento de candidaturas,
        organização de processos seletivos e conexão entre empresas e profissionais. A plataforma
        atua como ambiente tecnológico de apoio ao recrutamento e à seleção, não garantindo
        contratação, entrevistas, admissão, aprovação em processos seletivos ou resultados comerciais.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100">
        2. Cadastro e acesso
      </h2>
      <p class="leading-7">
        Para utilizar determinadas funcionalidades, o usuário poderá precisar criar conta e fornecer
        informações verdadeiras, completas e atualizadas. Cada usuário é responsável por manter a
        confidencialidade de suas credenciais de acesso e por todas as ações realizadas com sua conta.
        Caso identifique uso indevido, acesso não autorizado ou suspeita de comprometimento da conta,
        o usuário deve comunicar a Emprego OK imediatamente.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100">
        3. Regras para candidatos
      </h2>
      <p class="leading-7">
        O candidato se compromete a fornecer informações profissionais e pessoais corretas, a anexar
        documentos legítimos e a não praticar fraude, falsidade ideológica, envio de conteúdo ofensivo
        ou qualquer comportamento que prejudique empresas, recrutadores ou outros usuários. A decisão
        sobre convocação, entrevista, análise curricular e contratação pertence exclusivamente à empresa
        responsável pela vaga.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100">
        4. Regras para empresas e recrutadores
      </h2>
      <p class="leading-7">
        Empresas e recrutadores devem publicar apenas vagas reais, com informações claras, compatíveis
        com a legislação aplicável e relacionadas a oportunidades legítimas de trabalho. Não é permitido
        utilizar a plataforma para práticas discriminatórias, coleta indevida de dados, anúncios enganosos,
        spam, abordagens abusivas ou qualquer uso que viole direitos de terceiros. A empresa é responsável
        pelo conteúdo das vagas, pelos critérios de seleção adotados e pelo tratamento de dados pessoais
        realizado no contexto de suas contratações.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100">
        5. Uso permitido e condutas proibidas
      </h2>
      <p class="leading-7">
        É proibido usar a Emprego OK para atividades ilícitas, tentativas de invasão, engenharia reversa,
        cópia automatizada de dados, envio de arquivos maliciosos, manipulação indevida de métricas,
        tentativa de contornar mecanismos de segurança, violação de propriedade intelectual ou qualquer
        prática que comprometa a estabilidade e a confiança da plataforma. A Emprego OK poderá adotar
        medidas técnicas e administrativas para prevenir abusos e proteger o sistema.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100">
        6. Conteúdo e propriedade intelectual
      </h2>
      <p class="leading-7">
        A estrutura da plataforma, sua identidade visual, textos institucionais, marca, software,
        banco de dados, interfaces e demais elementos protegidos pertencem à Emprego OK ou a seus
        respectivos titulares. O usuário mantém a titularidade sobre os dados e conteúdos enviados
        por ele, mas concede as autorizações necessárias para que a plataforma processe, armazene,
        organize e exiba essas informações na medida exigida para a prestação do serviço.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100">
        7. Disponibilidade e limitações
      </h2>
      <p class="leading-7">
        A Emprego OK busca manter o serviço disponível, estável e seguro, mas não garante funcionamento
        ininterrupto ou ausência absoluta de falhas. Interrupções podem ocorrer por manutenção, atualização,
        incidentes de segurança, indisponibilidade de serviços de terceiros ou fatores externos. Dentro dos
        limites permitidos pela legislação, a plataforma não responde por prejuízos decorrentes de falhas
        de internet, indisponibilidades temporárias, decisões de contratação de terceiros ou uso indevido
        da conta pelo próprio usuário.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100">
        8. Suspensão e encerramento de acesso
      </h2>
      <p class="leading-7">
        A Emprego OK poderá limitar, suspender ou encerrar contas e acessos sempre que identificar indícios
        de fraude, violação destes termos, risco à segurança da plataforma, uso abusivo do serviço ou
        necessidade de cumprimento legal. Sempre que possível e adequado, o usuário será informado sobre a
        medida adotada. O usuário também poderá deixar de utilizar a plataforma a qualquer momento, sem
        prejuízo das obrigações já assumidas durante o período de uso.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100">
        9. Privacidade e tratamento de dados
      </h2>
      <p class="leading-7">
        O uso da plataforma envolve tratamento de dados pessoais necessários à operação dos serviços,
        especialmente para autenticação, publicação de vagas, candidaturas e gestão de processos seletivos.
        As regras sobre coleta, uso, compartilhamento, armazenamento e direitos dos titulares estão descritas
        na Política de Privacidade da Emprego OK, que complementa estes Termos de Uso.
      </p>
    </section>

    <section class="space-y-3">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-100">
        10. Atualizações destes termos
      </h2>
      <p class="leading-7">
        Estes Termos de Uso podem ser alterados para refletir mudanças legais, operacionais ou funcionais
        da plataforma. A versão mais atual será sempre publicada nesta página, com a respectiva data de
        atualização. O uso continuado da Emprego OK após a publicação de novas versões será interpretado
        como concordância com o conteúdo atualizado.
      </p>
    </section>
  </article>
</template>

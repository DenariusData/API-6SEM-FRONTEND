/**
 * composables/useAtualizacaoAutomatica.js
 *
 * Repete `atualizar()` a cada `intervalo` ms enquanto `ativo` for verdadeiro
 * (AKA-65: documentos em "Preparando para a busca"). Para sozinho quando
 * `ativo` vira falso, ao desmontar o componente e depois de `limite` ms — um
 * documento que ficou PROCESSANDO porque o servidor caiu não pode gerar
 * consultas para sempre. Nesse caso `esgotou` fica verdadeiro e a tela pede
 * para clicar em "Atualizar"; `reiniciar()` (chamado pelo Atualizar) volta a
 * contar do zero.
 *
 * Aba em segundo plano não consulta; a próxima consulta só é agendada quando
 * a anterior termina (sem chamadas sobrepostas).
 */

import { onBeforeUnmount, ref, watch } from 'vue';

export function useAtualizacaoAutomatica(
  ativo,
  atualizar,
  { intervalo = 5000, limite = 2 * 60 * 1000 } = {}
) {
  const atualizando = ref(false);
  const esgotou = ref(false);
  let timer = null;
  let inicio = 0;

  function parar() {
    clearTimeout(timer);
    timer = null;
    atualizando.value = false;
  }

  function agendar() {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (!ativo.value) return parar();
      if (Date.now() - inicio >= limite) {
        esgotou.value = true;
        return parar();
      }
      if (!document.hidden) {
        try {
          await atualizar();
        } catch {
          // falha pontual: tenta de novo no próximo ciclo
        }
      }
      if (atualizando.value) agendar();
    }, intervalo);
  }

  function iniciar() {
    if (atualizando.value || esgotou.value) return;
    inicio = Date.now();
    atualizando.value = true;
    agendar();
  }

  function reiniciar() {
    esgotou.value = false;
    parar();
    if (ativo.value) iniciar();
  }

  watch(
    ativo,
    (sim) => {
      if (sim) iniciar();
      else {
        esgotou.value = false;
        parar();
      }
    },
    { immediate: true }
  );

  onBeforeUnmount(parar);

  return { atualizando, esgotou, reiniciar };
}

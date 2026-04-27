import init, { wasm_smoke_test } from '@demiurge/wasm-sim/pkg/sim_core';

const status = document.querySelector<HTMLParagraphElement>('#status');

const boot = async (): Promise<void> => {
  await init();
  if (status) {
    status.textContent = `WASM loaded: ${wasm_smoke_test()}`;
  }
};

void boot();

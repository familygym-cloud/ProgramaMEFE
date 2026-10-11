export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Esta página não carregou</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <meta name="theme-color" content="#151515" />
    <style>
      /* Mesma identidade do site: Onix, Amarelo Real e Alabastro; títulos em New Order (se o arquivo existir) e texto em Urbanist. */
      @font-face { font-family: "New Order"; src: url("/fonts/NewOrder-Regular.otf") format("opentype"); font-weight: 100 900; font-style: normal; font-display: swap; }
      body { font: 15px/1.5 "Urbanist Variable", "Urbanist", system-ui, sans-serif; background: #151515; color: #e5e5e4; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-family: "New Order", "Urbanist Variable", "Urbanist", system-ui, sans-serif; font-weight: 800; font-synthesis: none; font-size: 1.5rem; margin: 0 0 0.5rem; }
      p { color: rgb(229 229 228 / 72%); margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #f9db5d; color: #151515; font-weight: 600; }
      .secondary { background: transparent; color: #e5e5e4; border-color: rgb(229 229 228 / 28%); }
      a:focus-visible, button:focus-visible { outline: 2px solid #f9db5d; outline-offset: 2px; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Esta página não carregou</h1>
      <p>Algo deu errado do nosso lado. Tente atualizar a página ou voltar ao início.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Tentar novamente</button>
        <a class="secondary" href="/">Voltar ao início</a>
      </div>
    </div>
  </body>
</html>`;
}

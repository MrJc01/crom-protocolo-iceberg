import Head from "next/head";
import DefaultLayout from "@/components/DefaultLayout";

export default function Sobre() {
  return (
    <DefaultLayout maxWidth="md">
      <Head>
        <title>Sobre · Iceberg</title>
      </Head>

      <article className="prose prose-invert max-w-none">
        <h1>🧊 Sobre o Protocolo Iceberg</h1>

        <p className="lead text-lg text-secondary">
          Uma plataforma <strong>descentralizada</strong> de informação cidadã, 
          inspirada no TabNews mas com total independência de servidores centrais.
        </p>

        <h2>O Problema</h2>
        <p>
          Plataformas de informação tradicionais são vulneráveis à censura, 
          dependentes de empresas centralizadas, e podem ser desligadas a qualquer momento.
        </p>

        <h2>A Solução</h2>
        <p>
          O Protocolo Iceberg distribui informações através de uma rede P2P, 
          onde cada nó valida e propaga conteúdo. Posts passam por níveis de 
          validação comunitária:
        </p>

        <ul>
          <li><strong>Nível 0 (Wild):</strong> Posts recém-criados</li>
          <li><strong>Nível 1 (Regional):</strong> Validados pela comunidade local</li>
          <li><strong>Nível 2 (Surface):</strong> Aceitos pela rede ampla</li>
          <li><strong>Nível 3 (Legacy):</strong> Registro histórico permanente</li>
        </ul>

        <h2>Tecnologia</h2>
        <ul>
          <li><strong>Identidade:</strong> Chaves ED25519 (sem email/senha)</li>
          <li><strong>Storage:</strong> SQLite local + sincronização P2P</li>
          <li><strong>Rede:</strong> WebRTC/WebSocket via relay servers</li>
          <li><strong>Frontend:</strong> Next.js (baseado no TabNews)</li>
        </ul>

        <h2>Open Source</h2>
        <p>
          O código é totalmente aberto sob licença AGPL-3.0. 
          <br />
          <a href="https://github.com/MrJc01/crom-protocolo-iceberg" className="text-primary">
            github.com/MrJc01/crom-protocolo-iceberg
          </a>
        </p>
      </article>
    </DefaultLayout>
  );
}

import Head from "next/head";
import DefaultLayout from "@/components/DefaultLayout";

export default function FAQ() {
  const faqs = [
    {
      q: "O que é o Protocolo Iceberg?",
      a: "Uma plataforma descentralizada para compartilhamento de informações, onde os dados são distribuídos entre os participantes da rede, sem depender de servidores centrais."
    },
    {
      q: "Como funciona a identidade?",
      a: "Usamos chaves criptográficas ED25519. Você recebe 24 palavras (mnemônico) que são a única forma de recuperar sua conta. Não pedimos email, senha ou dados pessoais."
    },
    {
      q: "O que são os níveis (Wild, Regional, Surface, Legacy)?",
      a: "Posts começam no Nível 0 (Wild) e sobem conforme recebem validação da comunidade. Nível 3 (Legacy) representa conteúdo historicamente verificado."
    },
    {
      q: "Meus dados ficam onde?",
      a: "Localmente no seu dispositivo (SQLite) e sincronizados via P2P com outros nós da rede. Não há servidor central armazenando seus dados."
    },
    {
      q: "Posso apagar meus posts?",
      a: "Posts até Nível 2 podem ser removidos. Posts Nível 3 (Legacy) são considerados registro histórico e não podem ser apagados."
    },
    {
      q: "O projeto é open source?",
      a: "Sim! Código disponível em github.com/MrJc01/crom-protocolo-iceberg sob licença AGPL-3.0."
    }
  ];

  return (
    <DefaultLayout maxWidth="md">
      <Head>
        <title>FAQ · Iceberg</title>
      </Head>

      <h1 className="text-2xl font-bold mb-6">❓ Perguntas Frequentes</h1>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <details key={i} className="bg-surface rounded-lg p-4 group">
            <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
              {faq.q}
              <span className="text-secondary group-open:rotate-180 transition">▼</span>
            </summary>
            <p className="mt-3 text-secondary">{faq.a}</p>
          </details>
        ))}
      </div>
    </DefaultLayout>
  );
}

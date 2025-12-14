import Head from "next/head";
import DefaultLayout from "@/components/DefaultLayout";

export default function TermosDeUso() {
  return (
    <DefaultLayout maxWidth="md">
      <Head>
        <title>Termos de Uso · Iceberg</title>
      </Head>

      <article className="prose prose-invert max-w-none">
        <h1>📜 Termos de Uso</h1>
        <p className="text-secondary">Última atualização: Dezembro 2024</p>

        <h2>1. Aceitação dos Termos</h2>
        <p>
          Ao utilizar o Protocolo Iceberg, você concorda com estes termos de uso. 
          O serviço é fornecido "como está" sem garantias.
        </p>

        <h2>2. Sistema Descentralizado</h2>
        <p>
          O Iceberg é um protocolo descentralizado. Isso significa que:
        </p>
        <ul>
          <li>Não há servidor central controlando seus dados</li>
          <li>Você é responsável por manter sua chave privada (mnemônico) segura</li>
          <li>Posts propagados pela rede podem ser impossíveis de remover após atingir Nível 3</li>
        </ul>

        <h2>3. Responsabilidade do Conteúdo</h2>
        <p>
          Você é o único responsável pelo conteúdo que publica. Não publique:
        </p>
        <ul>
          <li>Conteúdo ilegal</li>
          <li>Informações falsas ou difamatórias</li>
          <li>Spam ou conteúdo irrelevante para a comunidade</li>
        </ul>

        <h2>4. Moderação Comunitária</h2>
        <p>
          A validação de conteúdo é feita pela comunidade através de votos. 
          Posts com muitos reports negativos podem ser rebaixados de nível.
        </p>

        <h2>5. Licença</h2>
        <p>
          O código do Protocolo Iceberg é licenciado sob AGPL-3.0. 
          O conteúdo publicado pelos usuários permanece de propriedade de seus autores.
        </p>

        <h2>6. Sem Garantias</h2>
        <p>
          Este software é experimental. Não oferecemos garantias sobre 
          disponibilidade, segurança ou permanência dos dados.
        </p>
      </article>
    </DefaultLayout>
  );
}

import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="description" content="Protocolo Iceberg - Conhecimento da humanidade, preservado para sempre" />
      </Head>
      <body className="bg-background text-on-surface">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

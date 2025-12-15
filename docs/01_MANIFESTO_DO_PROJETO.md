# 01. Manifesto e Visão do Projeto: Protocolo Iceberg

## Resumo Executivo

O **Protocolo Iceberg** é uma plataforma descentralizada para preservar e compartilhar o conhecimento da humanidade. Como um WikiLeaks moderno, mas para **todo tipo de conteúdo** - arte, ciência, tecnologia, cultura, história, música, memes, jornalismo, e tudo mais que merece existir sem o risco de censura.

O sistema opera sem ponto único de falha (SPOF) e garante a perenidade do conhecimento humano.

O projeto é **100% Open Source** e utiliza como base visual o [TabNews](https://github.com/filipedeschamps/tabnews.com.br) do Filipe Deschamps, substituindo toda a infraestrutura centralizada por protocolos P2P descentralizados.

---

## Objetivo Principal

Criar um sistema onde:

1. **Qualquer pessoa** possa compartilhar conhecimento sem medo de censura
2. **Todo tipo de conteúdo** - arte, ciência, opiniões, humor, investigações - seja permitido
3. **Nenhum governo ou corporação** consiga censurar ou derrubar o conteúdo
4. **O conhecimento humano** seja preservado permanentemente para futuras gerações

---

## Filosofia "Clean & Distributed"

O projeto segue a estética e qualidade de código do TabNews (Clean Architecture), mas substitui toda a infraestrutura centralizada por protocolos P2P:

| Componente Original (TabNews) | Substituição (Iceberg)            |
| ----------------------------- | --------------------------------- |
| PostgreSQL                    | IPFS + OrbitDB/GunDB              |
| Email/Senha                   | Chaves Criptográficas (ED25519)   |
| API REST Centralizada         | SDK P2P Local                     |
| Servidor Único                | Rede Distribuída de Nós           |
| Vercel                        | Qualquer lugar (IPFS, Local, VPS) |

---

## Os 4 Pilares Fundamentais

### 1. Imutabilidade

O que é validado pela rede não pode ser apagado por decretos, coerção judicial ou ataques DDoS. Conteúdo de Nível 3 é gravado em blockchain de armazenamento permanente.

### 2. Anonimato Opcional

O usuário pode ser completamente anônimo, mas a veracidade é garantida por:

- Criptografia de assinatura digital
- Sistema de reputação baseado em histórico
- Provas de Conhecimento Zero (ZKP) para validações sensíveis

### 3. Localidade Geográfica

A informação deve ser relevante para o contexto do usuário:

- **Nível 0-1**: Restrito à região geográfica (cidade)
- **Nível 2**: Nacional/Continental
- **Nível 3**: Global e permanente

### 4. Meritocracia de Dados

A visibilidade da informação é baseada em:

- Consenso distribuído (votos verificados criptograficamente)
- Densidade de hospedagem (seeds)
- Tempo de permanência sem contestação
- **NÃO** em algoritmos de engajamento manipuláveis

---

## O Que o Projeto DEVE Ter

### Funcionalidades Obrigatórias

- [ ] Sistema de níveis (0, 1, 2, 3) com regras de promoção/queda
- [ ] Geolocalização opcional para filtragem de conteúdo regional
- [ ] Editor Markdown completo (herdado do TabNews)
- [ ] Sistema de votos assinados criptograficamente
- [ ] Perfis de usuário (Cidadão, Ativista, Auditor)
- [ ] Bounty system para incentivar auditoria
- [ ] Upload de arquivos para IPFS com hash verificável
- [ ] Árvore de comentários (threads) descentralizada
- [ ] Indicadores visuais de nível (bordas coloridas)
- [ ] Modo offline com sincronização posterior
- [ ] Suporte a múltiplos relays/gateways
- [ ] **CLI completa** para operações via terminal (baseada em crom-nodus)
- [ ] Integração com **@nodus/core** para rede P2P

### Características Técnicas Obrigatórias

- [ ] Armazenamento via IPFS (InterPlanetary File System)
- [ ] Comunicação via Libp2p
- [ ] Suporte opcional a Tor Onion Services
- [ ] Criptografia ED25519 para identidades
- [ ] Banco de dados distribuído (OrbitDB ou GunDB)
- [ ] SDK em TypeScript para desenvolvedores
- [ ] API local via HTTP para integração
- [ ] Configuração de consenso mutável via arquivo JSON

---

## O Que o Projeto NÃO PODE Ter

> [!CAUTION]
> **Violações Críticas** - Qualquer implementação destes itens invalida o projeto.

### Proibições Absolutas

- ❌ **Bancos de dados centralizados** (PostgreSQL, MySQL, MongoDB centralizado, Firebase)
- ❌ **Dependência de DNS tradicional** para funcionamento do core (usar hashes e magnet links)
- ❌ **Coleta de telemetria, logs de IP ou dados pessoais** dos usuários
- ❌ **Autenticação via Email/Senha** (apenas chaves criptográficas)
- ❌ **Servidor central obrigatório** para funcionamento básico
- ❌ **APIs de terceiros obrigatórias** (Google, Facebook, etc.)
- ❌ **Ponto único de controle** para moderação ou censura
- ❌ **Algoritmos de recomendação opacos** que não possam ser auditados

### Proibições de Design

- ❌ Interfaces que exponham endereços IP ou localização exata
- ❌ Requisição de documentos pessoais para criação de conta
- ❌ Armazenamento de senhas (mesmo com hash) - usar apenas chaves
- ❌ Dependência de CDNs centralizados para assets críticos

---

## Público-Alvo

### Primário

- **Cidadãos brasileiros** preocupados com corrupção e transparência
- **Jornalistas independentes** sem recursos para infraestrutura própria
- **Ativistas de direitos humanos** em ambientes hostis
- **Whistleblowers** que precisam de anonimato

### Secundário

- **Desenvolvedores** interessados em contribuir com código
- **Operadores de nós** que querem ajudar a manter a rede
- **ONGs e organizações** de fiscalização cidadã

---

## Escopo Inicial (Brasil)

O projeto inicia focado no Brasil por razões estratégicas:

1. **Base de usuários potencial** do TabNews já familiarizada com a interface
2. **Dados demográficos acessíveis** via API do IBGE
3. **Contexto político** que demanda ferramentas de transparência
4. **Comunidade desenvolvedora ativa** para contribuições

### Expansão Futura

- Fase 2: América Latina (Espanhol)
- Fase 3: Global (Inglês como língua base)

---

## Inspirações e Referências

| Projeto                                                      | O Que Aprendemos                             |
| ------------------------------------------------------------ | -------------------------------------------- |
| [TabNews](https://github.com/filipedeschamps/tabnews.com.br) | Clean Architecture, UX minimalista, Markdown |
| [WikiLeaks](https://wikileaks.org/)                          | Importância da redundância e resistência     |
| [IPFS](https://ipfs.io/)                                     | Armazenamento distribuído                    |
| [Tor Project](https://www.torproject.org/)                   | Anonimato na camada de rede                  |
| [SecureDrop](https://securedrop.org/)                        | Proteção de fontes jornalísticas             |
| [Mastodon](https://joinmastodon.org/)                        | Federação e autonomia de instâncias          |

---

## Licença

O projeto será distribuído sob **AGPL-3.0** (GNU Affero General Public License v3.0), garantindo que:

1. O código sempre permanecerá open source
2. Modificações devem ser compartilhadas
3. Serviços baseados no protocolo devem disponibilizar o código

---

## Próximos Documentos

1. [02_ARQUITETURA_DO_SISTEMA.md](./02_ARQUITETURA_DO_SISTEMA.md) - Stack técnico e estrutura
2. [03_LOGICA_DE_CONSENSO.md](./03_LOGICA_DE_CONSENSO.md) - Sistema de níveis e validação
3. [04_ESPECIFICACAO_FRONTEND.md](./04_ESPECIFICACAO_FRONTEND.md) - Adaptação do TabNews
4. [05_TOKENOMICS_E_INCENTIVOS.md](./05_TOKENOMICS_E_INCENTIVOS.md) - Economia do sistema
5. [06_SEGURANCA_E_PRIVACIDADE.md](./06_SEGURANCA_E_PRIVACIDADE.md) - Proteções e criptografia
6. [07_SDK_E_API.md](./07_SDK_E_API.md) - Documentação para desenvolvedores
7. [08_ROADMAP.md](./08_ROADMAP.md) - Fases de desenvolvimento

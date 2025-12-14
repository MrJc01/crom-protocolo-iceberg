# 10. Glossário e Referências

## Glossário de Termos

### A

**AGPL-3.0**
GNU Affero General Public License Version 3. Licença open source que exige que modificações sejam compartilhadas, inclusive para serviços em nuvem.

**Arweave**
Blockchain de armazenamento permanente. Usado no Nível 3 para garantir imutabilidade de longo prazo.

**Assinatura Digital**
Prova criptográfica de que uma mensagem foi criada pelo dono de uma chave privada específica. No Iceberg, usamos ED25519.

### B

**Blacklist**
Lista de CIDs temporariamente banidos por violação de regras ou fraude detectada.

**Bootstrap Node**
Nó inicial conhecido que ajuda novos participantes a descobrir outros peers na rede P2P.

**Bounty**
Recompensa depositada pelo autor de um post para incentivar a verificação rápida do conteúdo.

### C

**CID (Content Identifier)**
Identificador único de conteúdo no IPFS. Gerado a partir do hash do arquivo/dados, garantindo que o mesmo conteúdo sempre tenha o mesmo CID.

**Consenso**
Acordo entre os participantes da rede sobre o estado válido dos dados. No Iceberg, define a promoção de níveis.

**Criptografia Assimétrica**
Sistema que usa par de chaves (pública e privada) para encriptação e assinaturas. Chave pública é compartilhada, privada é secreta.

### D

**Daemon**
Processo que roda em background mantendo a conexão com a rede P2P e servindo dados via API local.

**Decoy Traffic**
Tráfego falso adicionado para mascarar padrões de acesso real e proteger privacidade geográfica.

**DHT (Distributed Hash Table)**
Tabela de lookup distribuída que permite encontrar peers e conteúdo na rede P2P sem servidor central.

**DPI (Deep Packet Inspection)**
Técnica usada por ISPs/governos para inspecionar conteúdo de pacotes de rede. Domain fronting ajuda a evitar.

### E

**ED25519**
Algoritmo de assinatura digital baseado em curvas elípticas. Rápido, seguro e com chaves compactas.

**Entropia**
Aleatoriedade usada para gerar chaves criptográficas. Quanto mais entropia, mais segura a chave.

**Escrow**
Custódia temporária de tokens/fundos até que condições sejam satisfeitas (ex: bounty aguardando verificação).

### F

**Fallback**
Mecanismo de backup quando o método principal falha. Ex: usar Tor se conexão direta for bloqueada.

**Filecoin**
Rede de armazenamento descentralizado incentivizado. Alternativa ao Arweave para Nível 3.

### G

**Gateway**
Ponto de acesso HTTP público para a rede P2P, permitindo acesso via navegador sem rodar daemon local.

**GeoHash**
Sistema de codificação de coordenadas geográficas em string curta. Permite indexação espacial eficiente.

**Go (Golang)**
Linguagem de programação criada pelo Google, usada no core-daemon por sua performance e facilidade com concorrência.

### H

**Hash**
Função matemática que transforma dados de qualquer tamanho em string de tamanho fixo. Usada para verificar integridade.

### I

**IBGE**
Instituto Brasileiro de Geografia e Estatística. Fornece dados populacionais para cálculo de thresholds regionais.

**Identicon**
Avatar gerado algoritmicamente a partir de um identificador único (como chave pública).

**Imutabilidade**
Propriedade de dados que não podem ser alterados após criação. Garantida por hash + consenso.

**IPFS (InterPlanetary File System)**
Protocolo de armazenamento e compartilhamento de arquivos descentralizado baseado em content-addressing.

### K

**Keypair**
Par de chaves criptográficas: pública (pode compartilhar) e privada (deve manter secreta).

### L

**Libp2p**
Biblioteca modular de networking P2P. Suporta diversos transportes, protocolos de discovery e comunicação.

**Logging**
Registro de eventos do sistema. No Iceberg, logs são redatados para não expor dados sensíveis.

### M

**Markdown**
Linguagem de marcação leve para formatação de texto. Padrão para conteúdo no Iceberg.

**Mnemonic**
Frase de 12 ou 24 palavras que representa uma chave privada de forma legível para humanos.

**Monorepo**
Repositório único contendo múltiplos projetos/pacotes relacionados. Facilita desenvolvimento coordenado.

### N

**NAT Traversal**
Técnicas para estabelecer conexões P2P através de firewalls e roteadores domésticos.

**Next.js**
Framework React para aplicações web. Usado no web-client do Iceberg.

**Node (Nó)**
Computador participante da rede P2P, rodando o daemon e contribuindo com armazenamento/bandwidth.

### O

**Onion Service**
Serviço acessível apenas via rede Tor, com endereço .onion. Garante anonimato do servidor e cliente.

**OrbitDB**
Banco de dados peer-to-peer construído sobre IPFS. Uma das opções para índice distribuído.

**OSINT**
Open Source Intelligence. Inteligência obtida de fontes públicas.

### P

**P2P (Peer-to-Peer)**
Arquitetura onde participantes se conectam diretamente sem servidor central.

**Pin**
Instrução para um nó IPFS manter um arquivo disponível localmente, evitando garbage collection.

**Proof of Storage**
Desafio criptográfico para provar que um nó realmente possui os dados que afirma ter.

**Proof of Work**
Problema computacional que exige esforço para resolver. Usado como barreira anti-spam.

**PubSub**
Publish-Subscribe. Padrão de mensageria onde publicadores enviam para tópicos e assinantes recebem.

### R

**Rate Limiting**
Limitação de quantidade de ações por período de tempo para prevenir abuso.

**Relay**
Nó intermediário que ajuda a estabelecer conexões entre peers que não conseguem se conectar diretamente.

**Reputação (TrustScore)**
Pontuação acumulada baseada em comportamento histórico. Afeta peso de votos e privilégios.

### S

**SDK (Software Development Kit)**
Biblioteca que facilita integração com o protocolo, abstraindo complexidade técnica.

**Seed/Seeding**
Manter cópia de um arquivo e disponibilizá-lo para outros na rede. Inspirado em BitTorrent.

**SHA-256**
Algoritmo de hash criptográfico de 256 bits. Padrão amplamente usado, incluindo Bitcoin e IPFS.

**Sharding**
Dividir dados em partes menores distribuídas por diferentes nós para escalabilidade.

**Slashing**
Penalidade (perda de tokens/reputação) por comportamento malicioso ou dishonesto.

**Smart Contract**
Código auto-executável em blockchain que gerencia lógica de bounties e pagamentos.

**SPOF (Single Point of Failure)**
Componente cuja falha derruba todo o sistema. Arquiteturas descentralizadas evitam SPOF.

**Stake/Staking**
Bloquear tokens como garantia para participar de validação e ganhar recompensas.

**Super Node**
Nó com alta reputação/stake que tem peso maior em decisões de consenso (Nível 3).

**Sybil Attack**
Ataque onde adversário cria múltiplas identidades falsas para manipular sistema.

### T

**TabNews**
Plataforma brasileira de conteúdo tech criada por Filipe Deschamps. Inspiração para o frontend do Iceberg.

**Tailwind CSS**
Framework CSS utilitário. Usado para estilização rápida e consistente.

**Timestamp**
Registro de data/hora. Usado para provar quando algo foi criado/modificado.

**Token**
Unidade de valor digital. O ICEBERG (ICB) é o token opcional do protocolo.

**Tor**
Rede de anonimato que roteia tráfego através de múltiplos relays para ocultar origem.

**Turborepo**
Ferramenta de build para monorepos. Otimiza builds incrementais e caching.

**TypeScript**
Superset de JavaScript com tipos estáticos. Usado no SDK e frontend.

### V

**Validação Cruzada**
Verificação por múltiplas regiões para evitar que uma comunidade isolada esconda ou promova conteúdo injustamente.

**Vesting**
Período de bloqueio de tokens antes de poderem ser movimentados.

### W

**WebSocket**
Protocolo de comunicação bidirecional em tempo real sobre HTTP.

**Whistleblower**
Pessoa que revela informação sobre atividades ilícitas ou antiéticas dentro de organizações.

### Z

**Zero-Knowledge Proof (ZKP)**
Prova criptográfica de que algo é verdade sem revelar informação adicional.

---

## Referências Técnicas

### Documentos Oficiais

| Tecnologia | Documentação                                                   |
| ---------- | -------------------------------------------------------------- |
| IPFS       | https://docs.ipfs.tech/                                        |
| Libp2p     | https://docs.libp2p.io/                                        |
| ED25519    | https://ed25519.cr.yp.to/                                      |
| Tor        | https://www.torproject.org/docs/                               |
| BIP39      | https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki |
| OrbitDB    | https://github.com/orbitdb/orbitdb                             |
| GunDB      | https://gun.eco/docs/                                          |

### Bibliotecas Utilizadas

| Biblioteca   | Uso            | Link                                |
| ------------ | -------------- | ----------------------------------- |
| TweetNaCl.js | Criptografia   | https://tweetnacl.js.org/           |
| bip39        | Mnemonic       | https://github.com/bitcoinjs/bip39  |
| go-ipfs      | IPFS embarcado | https://github.com/ipfs/kubo        |
| libp2p (Go)  | Networking P2P | https://github.com/libp2p/go-libp2p |

### Artigos Acadêmicos

1. **Kademlia DHT**

   - "Kademlia: A Peer-to-peer Information System Based on the XOR Metric"
   - Maymounkov & Mazières, 2002

2. **Sybil Attacks**

   - "The Sybil Attack"
   - Douceur, 2002

3. **Proof of Work**

   - "Pricing via Processing or Combatting Junk Mail"
   - Dwork & Naor, 1992

4. **IPFS**
   - "IPFS - Content Addressed, Versioned, P2P File System"
   - Benet, 2014

### Projetos Inspiradores

| Projeto                                                      | O que aprendemos                     |
| ------------------------------------------------------------ | ------------------------------------ |
| [TabNews](https://github.com/filipedeschamps/tabnews.com.br) | UX/UI limpa, foco em conteúdo        |
| [WikiLeaks](https://wikileaks.org/)                          | Importância da resistência a censura |
| [SecureDrop](https://securedrop.org/)                        | Proteção de fontes                   |
| [Mastodon](https://joinmastodon.org/)                        | Federação descentralizada            |
| [Scuttlebutt](https://scuttlebutt.nz/)                       | P2P social network                   |
| [Dat Protocol](https://dat.foundation/)                      | Versionamento distribuído            |

---

## Contato e Comunidade

### Canais Oficiais

| Canal              | Propósito            |
| ------------------ | -------------------- |
| GitHub Issues      | Bugs e features      |
| GitHub Discussions | Discussões técnicas  |
| Discord/Matrix     | Comunidade (a criar) |

### Contribuição

Para contribuir com o projeto, leia:

1. [08_ROADMAP.md](./08_ROADMAP.md) - Entenda as prioridades
2. [09_GUIA_ADAPTACAO_TABNEWS.md](./09_GUIA_ADAPTACAO_TABNEWS.md) - Para frontend
3. Código de Conduta (a criar)

---

## Navegação

← [09_GUIA_ADAPTACAO_TABNEWS.md](./09_GUIA_ADAPTACAO_TABNEWS.md)

[Voltar ao Índice](../README.md)

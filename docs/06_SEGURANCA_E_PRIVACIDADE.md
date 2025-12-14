# 06. Segurança e Privacidade

## Visão Geral

A segurança do Protocolo Iceberg é construída em camadas, protegendo:

1. **Identidade** do usuário (anonimato opcional)
2. **Integridade** dos dados (imutabilidade)
3. **Disponibilidade** do conteúdo (resistência à censura)
4. **Privacidade** das comunicações (criptografia ponta-a-ponta)

---

## 1. Modelo de Ameaças

### Adversários Considerados

| Adversário            | Capacidade                                | Exemplo                |
| --------------------- | ----------------------------------------- | ---------------------- |
| **Hacker Individual** | Comprometer dispositivos isolados         | Phishing, Malware      |
| **Grupo Organizado**  | Ataques Sybil, DDoS coordenado            | Bots políticos, trolls |
| **Corporação**        | Pressão legal, bloqueio de CDN            | Big Tech compliance    |
| **Estado-Nação**      | Bloqueio de internet, vigilância em massa | Great Firewall         |

### Ameaças Específicas

```
1. Deanonimização: Descobrir quem postou o quê
2. Censura: Derrubar conteúdo inconveniente
3. Manipulação: Alterar votos ou conteúdo
4. Perseguição: Atacar usuários específicos
5. Flooding: Sobrecarregar com spam/lixo
```

---

## 2. Criptografia

### Algoritmos Utilizados

| Função                     | Algoritmo         | Justificativa                      |
| -------------------------- | ----------------- | ---------------------------------- |
| **Identidade**             | ED25519           | Curvas elípticas rápidas e seguras |
| **Hash**                   | SHA-256 / BLAKE3  | Padrão IPFS, alta performance      |
| **Criptografia Simétrica** | ChaCha20-Poly1305 | Seguro e rápido (mobile-friendly)  |
| **Key Exchange**           | X25519            | Diffie-Hellman em curva elíptica   |
| **Assinatura**             | ED25519           | Compacta e verificável             |

### Geração de Identidade

```typescript
// packages/sdk/src/crypto/identity.ts

import * as nacl from "tweetnacl";
import * as bip39 from "bip39";

interface Identity {
  publicKey: Uint8Array; // 32 bytes
  secretKey: Uint8Array; // 64 bytes (inclui seed)
}

export async function generateIdentity(): Promise<{
  identity: Identity;
  mnemonic: string;
}> {
  // Gerar 256 bits de entropia
  const entropy = nacl.randomBytes(32);

  // Converter para mnemonic (24 palavras)
  const mnemonic = bip39.entropyToMnemonic(Buffer.from(entropy));

  // Derivar seed do mnemonic
  const seed = await bip39.mnemonicToSeed(mnemonic);

  // Usar primeiros 32 bytes como seed ED25519
  const keypair = nacl.sign.keyPair.fromSeed(seed.slice(0, 32));

  return {
    identity: {
      publicKey: keypair.publicKey,
      secretKey: keypair.secretKey,
    },
    mnemonic,
  };
}

export function signMessage(
  message: Uint8Array,
  secretKey: Uint8Array
): Uint8Array {
  return nacl.sign.detached(message, secretKey);
}

export function verifySignature(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  return nacl.sign.detached.verify(message, signature, publicKey);
}
```

### Encriptação de Arquivos

```typescript
// packages/sdk/src/crypto/encryption.ts

import * as nacl from "tweetnacl";

interface EncryptedFile {
  nonce: Uint8Array; // 24 bytes
  ciphertext: Uint8Array; // variável
}

export function encryptFile(
  file: Uint8Array,
  recipientPublicKey: Uint8Array,
  senderSecretKey: Uint8Array
): EncryptedFile {
  const nonce = nacl.randomBytes(24);
  const ciphertext = nacl.box(file, nonce, recipientPublicKey, senderSecretKey);

  return { nonce, ciphertext };
}

export function decryptFile(
  encrypted: EncryptedFile,
  senderPublicKey: Uint8Array,
  recipientSecretKey: Uint8Array
): Uint8Array | null {
  return nacl.box.open(
    encrypted.ciphertext,
    encrypted.nonce,
    senderPublicKey,
    recipientSecretKey
  );
}
```

---

## 3. Anonimato na Rede

### Camadas de Proteção

```
┌─────────────────────────────────────────┐
│         Camada de Aplicação             │
│  (Identidade = Chave Pública apenas)    │
├─────────────────────────────────────────┤
│         Camada de Transporte            │
│  (Tor / I2P - Opcional mas recomendado) │
├─────────────────────────────────────────┤
│         Camada de Rede P2P              │
│  (Libp2p com NAT traversal)             │
├─────────────────────────────────────────┤
│         Camada de Internet              │
│  (IP real exposto sem Tor)              │
└─────────────────────────────────────────┘
```

### Integração com Tor

```go
// packages/core-daemon/internal/network/tor.go

package network

import (
    "github.com/cretz/bine/tor"
)

type TorConfig struct {
    Enabled        bool
    DataDir        string
    OnionServicePort int
}

func (n *NetworkManager) EnableTor(config TorConfig) error {
    // Iniciar processo Tor embarcado
    t, err := tor.Start(nil, &tor.StartConf{
        DataDir: config.DataDir,
    })
    if err != nil {
        return err
    }

    // Criar Onion Service para aceitar conexões
    onion, err := t.Listen(nil, &tor.ListenConf{
        RemotePorts: []int{config.OnionServicePort},
    })
    if err != nil {
        return err
    }

    n.torListener = onion
    n.onionAddress = onion.ID + ".onion"

    return nil
}
```

### Traffic Analysis Protection

Para evitar que observadores saibam qual região o usuário está vendo:

```typescript
// O usuário seleciona "São Paulo"
// O app NÃO baixa apenas dados de São Paulo

async function fetchRegionalContent(selectedRegion: string) {
  // Baixar região selecionada
  const realData = await fetchRegion(selectedRegion);

  // Baixar 3-5 regiões aleatórias (decoy traffic)
  const decoyRegions = selectRandomRegions(5);
  await Promise.all(decoyRegions.map(fetchRegion));

  // Retornar apenas dados reais
  return realData;
}
```

---

## 4. Integridade de Dados

### Content Addressing (IPFS)

Cada arquivo é identificado pelo seu hash (CID):

```
Conteúdo → SHA-256 → CID (Content Identifier)

Exemplo:
"Hello World" → QmWATWQ7fVPP2EFGu71UkfnqhYXDYH566qy47CnJDgvs8u
```

**Propriedade:** Se alguém alterar 1 bit do arquivo, o CID muda completamente.

### Assinatura de Posts

Todo post é assinado pelo autor:

```typescript
interface SignedPost {
  content: {
    title: string;
    body: string;
    timestamp: number;
    region: string;
    attachments: string[]; // CIDs
  };

  // Metadados de assinatura
  author: string; // Public Key (base58)
  signature: string; // ED25519 signature (base64)
}

function createPost(content: PostContent, secretKey: Uint8Array): SignedPost {
  const contentBytes = canonicalSerialize(content);
  const signature = sign(contentBytes, secretKey);

  return {
    content,
    author: encodePublicKey(secretKey),
    signature: encodeSignature(signature),
  };
}
```

### Verificação em Cadeia

```
Post → Assinatura válida? → Hash bate com CID? → Consenso aceita?
```

---

## 5. Resistência à Censura

### Multi-Gateway

O sistema conecta a múltiplos gateways/relays:

```json
// config/bootstrap_nodes.json
{
  "nodes": [
    {
      "name": "Brazil-1",
      "multiaddr": "/dns4/br1.iceberg.network/tcp/4001/p2p/Qm...",
      "region": "SA"
    },
    {
      "name": "Europe-1",
      "multiaddr": "/dns4/eu1.iceberg.network/tcp/4001/p2p/Qm...",
      "region": "EU"
    },
    {
      "name": "Asia-1",
      "multiaddr": "/dns4/asia1.iceberg.network/tcp/4001/p2p/Qm...",
      "region": "AS"
    }
  ]
}
```

### Fallback para Tor

```go
func (n *NetworkManager) Connect() error {
    // Tentar conexão direta primeiro
    err := n.connectDirect()
    if err == nil {
        return nil
    }

    // Se falhar (bloqueio de ISP), tentar Tor
    log.Warn("Conexão direta falhou, tentando Tor...")
    return n.connectViaTor()
}
```

### Domain Fronting (Anti-DPI)

Para burlar Deep Packet Inspection:

```go
// Fingir que é tráfego para Google/AWS
func (n *NetworkManager) EnableDomainFronting() {
    n.transport = &http.Transport{
        TLSClientConfig: &tls.Config{
            ServerName: "www.google.com", // SNI falso
        },
    }
    // Conexão real vai para nosso servidor, mas parece Google
}
```

---

## 6. Proteção do Dispositivo

### Armazenamento Seguro de Chaves

```typescript
// Nunca armazenar chave privada em texto plano

interface SecureStorage {
  // Derivar chave de encriptação da senha do usuário
  deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array>;

  // Encriptar chave privada antes de salvar
  encryptSecretKey(
    secretKey: Uint8Array,
    password: string
  ): Promise<EncryptedKey>;

  // Descriptografar para uso
  decryptSecretKey(
    encrypted: EncryptedKey,
    password: string
  ): Promise<Uint8Array>;
}
```

### Modo Pânico (Panic Button)

```typescript
// Se o usuário digitar senha especial, mostra app falso

interface PanicMode {
  // Senha real abre o app normal
  realPassword: "minhaSenhaForte123";

  // Senha de pânico abre app falso
  panicPassword: "senhaFalsa456";

  // App falso mostra
  decoyContent: {
    type: "recipe_app"; // ou 'notes', 'weather', etc.
    data: RecipeData;
  };
}
```

---

## 7. Auditoria e Logging

### O Que NÃO Logamos

> [!CAUTION]
> Nunca armazenar identificadores pessoais em logs.

```
❌ Endereços IP de usuários
❌ Chaves privadas (óbvio)
❌ Conteúdo dos posts antes de publicar
❌ Padrões de acesso individual
❌ Geolocalização precisa
```

### O Que Logamos (Apenas para Debug)

```
✅ Erros de conexão (sem IPs)
✅ Métricas agregadas de rede
✅ Performance de consenso
✅ Hash de transações (não conteúdo)
```

### Log Rotation

```yaml
# config/logging.yaml
logging:
  level: info
  format: json
  output: file

  rotation:
    maxSizeMB: 10
    maxAgeDays: 7
    maxBackups: 3
    compress: true

  redaction:
    - pattern: '([0-9]{1,3}\.){3}[0-9]{1,3}'
      replace: "[IP_REDACTED]"
    - pattern: "(Qm[a-zA-Z0-9]{44})"
      replace: "[CID_REDACTED]"
```

---

## 8. Proteções Contra Ataques

### Ataque Sybil

**Ameaça:** Criar milhares de identidades falsas para manipular votos.

**Mitigações:**

1. Proof of Work na criação de identidade
2. Quarentena de 7 dias para novatos
3. Peso de voto baseado em reputação
4. Detecção de padrões suspeitos (votos simultâneos)

### Ataque de Eclipse

**Ameaça:** Isolar um nó cercando-o com peers maliciosos.

**Mitigações:**

1. Lista de bootstrap nodes confiáveis
2. Verificação de informação de múltiplas fontes
3. Rotação periódica de peers

### Ataque de Replay

**Ameaça:** Reenviar transação antiga para duplicar efeito.

**Mitigações:**

```typescript
interface Transaction {
  content: any;
  timestamp: number; // Validade de 1 hora
  nonce: string; // Único por transação
  previousTxHash: string; // Encadeamento
}
```

### DoS/DDoS

**Ameaça:** Sobrecarregar a rede com requisições.

**Mitigações:**

1. Rate limiting por identidade
2. Proof of Work para ações custosas
3. Múltiplos pontos de entrada (gateways)
4. Blacklist temporária de IPs abusivos

---

## 9. Moderação de Conteúdo Ilegal

### O Dilema

Uma plataforma incensurável pode ser usada para crimes reais (CSAM, terrorismo).

### Solução: Hashlist Compartilhada

```typescript
// Lista de hashes de conteúdo ilegal conhecido
// Mantida por organizações (NCMEC, IWF, etc.)

interface ContentFilter {
  // Hashes de conteúdo ilegal conhecido
  blocklist: Set<string>;

  // Fontes confiáveis da blocklist
  sources: ["https://ncmec.org/csam-hashlist", "https://iwf.org.uk/hash-list"];

  // Atualização periódica
  updateInterval: "24h";
}

function shouldPropagate(cid: string): boolean {
  // Se o hash está na blocklist, não propagar
  return !contentFilter.blocklist.has(cid);
}
```

### Moderação por Consenso

```
1. Usuário reporta conteúdo como ilegal
2. Múltiplos usuários confirmam
3. Conteúdo é "enterrado" (não propagado)
4. Hash é adicionado à blocklist local
5. Registro é mantido para autoridades (se requisitado legalmente)
```

---

## 10. Compliance e Jurisdição

### Arquitetura "No-Knowledge"

O operador de um nó **não pode** saber:

- Quem postou o quê
- Quem hospeda qual conteúdo
- Padrões de acesso individual

### Responsabilidade Legal

```
┌────────────────────────────────────────────────────────────┐
│              CARTA DE RESPONSABILIDADE                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  O operador de um nó Iceberg é análogo a um operador de    │
│  infraestrutura de internet (ISP/CDN).                      │
│                                                             │
│  NÃO é responsável pelo conteúdo, pois:                    │
│  1. Não sabe o que está hospedando (dados cifrados)        │
│  2. Não pode decodificar sem chave do autor                │
│  3. Não tem controle editorial                             │
│                                                             │
│  Referência: Safe Harbor (DMCA), Marco Civil (Brasil)      │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 11. Checklist de Segurança para Deploy

### Antes de Lançar

- [ ] Auditoria de código por terceiros
- [ ] Testes de penetração
- [ ] Fuzzing de inputs
- [ ] Verificação de dependências (npm audit, govulncheck)
- [ ] Análise estática (SAST)
- [ ] Documentação de modelo de ameaças

### Operacional

- [ ] Monitoramento de anomalias
- [ ] Plano de resposta a incidentes
- [ ] Canais seguros de report de vulnerabilidades
- [ ] Atualizações automáticas de segurança

---

## Próximo Documento

Veja [07_SDK_E_API.md](./07_SDK_E_API.md) para a documentação completa do SDK.

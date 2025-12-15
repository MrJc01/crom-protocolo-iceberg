import { useState, useEffect, useRef } from 'react';
import { api, useStore } from '@/lib/store';

interface ChatMessage {
  id: string;
  fromPubKey: string;
  toPubKey: string;
  content: string;
  createdAt: number;
  read: boolean;
}

interface Conversation {
  peer: string;
  lastMessage: ChatMessage;
  unread: number;
}

function shortenPubKey(pubKey: string): string {
  if (pubKey.length <= 16) return pubKey;
  return pubKey.slice(0, 8) + '...' + pubKey.slice(-6);
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export default function ChatWidget() {
  const { identity } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [newChatPubKey, setNewChatPubKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (identity && isOpen) {
      loadConversations();
    }
  }, [identity, isOpen]);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    try {
      const data = await api.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
    }
  }

  async function loadMessages(peerPubKey: string) {
    setLoading(true);
    try {
      const data = await api.getMessages(peerPubKey);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChat || !newMessage.trim()) return;

    try {
      await api.sendMessage(activeChat, newMessage.trim());
      setNewMessage('');
      loadMessages(activeChat);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  }

  function startNewChat(e: React.FormEvent) {
    e.preventDefault();
    if (!newChatPubKey.trim()) return;
    setActiveChat(newChatPubKey.trim());
    setNewChatPubKey('');
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  if (!identity) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        <span className="text-2xl">💬</span>
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
            {totalUnread}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-surface rounded-lg shadow-xl border border-gray-700 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeChat && (
                <button
                  onClick={() => setActiveChat(null)}
                  className="text-white hover:bg-white/20 rounded p-1"
                >
                  ←
                </button>
              )}
              <h3 className="text-white font-semibold">
                {activeChat ? shortenPubKey(activeChat) : 'Mensagens'}
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded p-1"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {!activeChat ? (
              // Conversations list
              <div>
                <form onSubmit={startNewChat} className="mb-3">
                  <input
                    type="text"
                    value={newChatPubKey}
                    onChange={(e) => setNewChatPubKey(e.target.value)}
                    placeholder="Cole a chave pública..."
                    className="w-full bg-background border border-gray-700 rounded px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full mt-2 py-2 bg-primary/20 text-primary text-sm rounded hover:bg-primary/30"
                  >
                    Nova conversa
                  </button>
                </form>

                {conversations.length === 0 ? (
                  <p className="text-secondary text-center text-sm py-4">
                    Nenhuma conversa ainda
                  </p>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <button
                        key={conv.peer}
                        onClick={() => setActiveChat(conv.peer)}
                        className="w-full p-3 bg-background rounded-lg hover:bg-gray-800 text-left"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-on-surface">
                            {shortenPubKey(conv.peer)}
                          </span>
                          {conv.unread > 0 && (
                            <span className="w-5 h-5 bg-primary rounded-full text-white text-xs flex items-center justify-center">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className="text-xs text-secondary truncate mt-1">
                            {conv.lastMessage.content}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Messages
              <div className="flex flex-col h-full">
                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="flex-1 space-y-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`max-w-[80%] p-2 rounded-lg text-sm ${
                          msg.fromPubKey === identity.publicKey
                            ? 'ml-auto bg-primary text-white'
                            : 'bg-background text-on-surface'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <span className="text-xs opacity-60 block text-right mt-1">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          {activeChat && (
            <form onSubmit={sendMessage} className="p-3 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-background border border-gray-700 rounded px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-3 py-2 bg-primary text-white rounded disabled:opacity-50"
                >
                  ➤
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

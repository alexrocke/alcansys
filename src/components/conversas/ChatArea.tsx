import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Phone, ArrowLeftRight, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const statusLabels: Record<string, string> = {
  aberta: 'Aberta',
  em_atendimento: 'Em Atendimento',
  aguardando: 'Aguardando',
  resolvida: 'Resolvida',
  arquivada: 'Arquivada',
};

const statusColors: Record<string, string> = {
  aberta: 'bg-blue-500/10 text-blue-700 border-blue-200',
  em_atendimento: 'bg-green-500/10 text-green-700 border-green-200',
  aguardando: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  resolvida: 'bg-gray-500/10 text-gray-700 border-gray-200',
  arquivada: 'bg-gray-500/10 text-gray-500 border-gray-200',
};

interface ChatAreaProps {
  selectedConversation: any;
  messages: any[];
  newMessage: string;
  onNewMessageChange: (msg: string) => void;
  onSendMessage: () => void;
  isSending: boolean;
  onHandoff: () => void;
  onBack: () => void;
  isMobile: boolean;
}

export function ChatArea({
  selectedConversation,
  messages,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  isSending,
  onHandoff,
  onBack,
  isMobile,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!selectedConversation) {
    return (
      <div className={`flex-1 flex items-center justify-center ${isMobile ? 'hidden' : 'flex'}`}>
        <div className="text-center">
          <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Selecione uma conversa</h2>
          <p className="text-muted-foreground">Escolha uma conversa na lista ao lado para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col ${!selectedConversation && isMobile ? 'hidden' : 'flex'}`}>
      {/* Chat Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="md:hidden" onClick={onBack}>←</Button>
          <div>
            <p className="font-semibold text-foreground">{selectedConversation.contato_nome}</p>
            <div className="flex items-center gap-2">
              {selectedConversation.contato_telefone && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />{selectedConversation.contato_telefone}
                </span>
              )}
              <Badge variant="outline" className={statusColors[selectedConversation.status]}>
                {statusLabels[selectedConversation.status]}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onHandoff} className="gap-1">
            <ArrowLeftRight className="h-4 w-4" />
            {selectedConversation.atendente_tipo === 'ia' ? 'Assumir' : 'Passar p/ IA'}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3 max-w-3xl mx-auto">
          {messages.map((msg: any) => (
            <div key={msg.id} className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                msg.direction === 'outgoing'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}>
                {msg.direction === 'outgoing' && msg.sender_type && (
                  <div className="flex items-center gap-1 mb-1">
                    {msg.sender_type === 'ia' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    <span className="text-[10px] opacity-75">
                      {msg.sender_type === 'ia' ? 'IA' : msg.sender?.nome || 'Agente'}
                    </span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${msg.direction === 'outgoing' ? 'opacity-75' : 'text-muted-foreground'}`}>
                  {format(new Date(msg.created_at), 'HH:mm')}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Textarea
            value={newMessage}
            onChange={(e) => onNewMessageChange(e.target.value)}
            placeholder="Digite sua mensagem..."
            rows={1}
            className="flex-1 min-h-[40px] max-h-[120px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSendMessage();
              }
            }}
          />
          <Button onClick={onSendMessage} disabled={!newMessage.trim() || isSending} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

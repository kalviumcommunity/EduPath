import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/useAuth';
import { chatService } from '@/services/api.service';
import BackButton from '@/components/BackButton';

const Chat = ({ navigate, selectedUniversity }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, newMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);
    try {
      const context = selectedUniversity ? { recommendedUniversities: [selectedUniversity] } : {};
      const history = messages.filter(m => m.role !== 'system').slice(-6).map(m => ({ message: m.content, reply: '' }));
      const resp = await chatService.sendMessage(currentInput, context, history);
      if (resp.success) {
        setMessages(prev => [...prev, { role: 'ai', content: resp.data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, something went wrong.' }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Error: ' + (e.message || 'Failed to send message') }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Back Button - Top Left Corner */}
      <div className="fixed left-4 top-4 z-50">
        <BackButton onBack={() => navigate('dashboard')} />
      </div>

      <div className="container-custom py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary">AI Counselor Chat</h1>
        </div>
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-96 overflow-y-auto rounded-lg bg-gray-50 p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`p-3 rounded-lg text-sm ${m.role==='user' ? 'bg-primary text-white ml-auto max-w-md' : 'bg-white border border-gray-200 mr-auto max-w-md'}`}>{m.content}</div>
              ))}
              {loading && <div className="text-xs text-text-secondary">Thinking...</div>}
            </div>
            <div className="flex gap-2">
              <Input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about universities..." onKeyDown={e=>{if(e.key==='Enter'){sendMessage();}}} />
              <Button onClick={sendMessage} disabled={loading}>Send</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;

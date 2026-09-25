import { useParams, useNavigate } from 'react-router-dom';
import { MessagesSquare } from 'lucide-react';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="mx-auto h-[calc(100vh-4rem)] max-w-6xl sm:px-4 sm:py-6">
      <div className="flex h-full overflow-hidden border-x bg-card sm:rounded-lg sm:border sm:shadow-sm">
        <aside
          className={`w-full flex-col border-r sm:flex sm:w-80 ${chatId ? 'hidden' : 'flex'}`}
        >
          <div className="border-b px-4 py-3.5">
            <h1 className="font-semibold tracking-tight">Chats</h1>
          </div>
          <ChatList activeChatId={chatId} />
        </aside>

        <section className={`min-w-0 flex-1 sm:flex ${chatId ? 'flex' : 'hidden'} flex-col`}>
          {chatId ? (
            <ChatWindow chatId={chatId} onBack={() => navigate('/chat')} />
          ) : (
            <div className="hidden h-full flex-col items-center justify-center gap-3 text-center sm:flex">
              <MessagesSquare className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Chats unlock automatically once a booking request is accepted.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ChatPage;

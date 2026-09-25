import { Link } from 'react-router-dom';
import { Home as HomeIcon, MessagesSquare } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useGetChatRoomsQuery } from '@/redux/slices/chatApiSlice';
import { cn } from '@/lib/utils';
import Loader from '@/components/common/Loader';
import EmptyState from '@/components/common/EmptyState';
import { timeAgo } from '@/utils/formatDate';
import { getInitials } from '@/utils/helpers';

const ChatList = ({ activeChatId }) => {
  const { data, isLoading } = useGetChatRoomsQuery();
  const onlineUserIds = useSelector((state) => state.chat.onlineUserIds);
  const unreadCounts = useSelector((state) => state.chat.unreadCounts);

  const chats = data?.data ?? [];

  if (isLoading) return <Loader className="min-h-[200px]" />;

  if (chats.length === 0) {
    return (
      <EmptyState
        icon={MessagesSquare}
        title="No conversations yet"
        description="Chats unlock when a booking request is accepted."
      />
    );
  }

  return (
    <ul className="flex-1 space-y-2 overflow-y-auto p-3">
      {chats.map((chat) => {
        const other = chat.otherParticipant;
        const isOnline = other && onlineUserIds.includes(String(other._id));
        const unread = unreadCounts[chat._id] || 0;
        return (
          <li key={chat._id}>
            <Link
              to={`/chat/${chat._id}`}
              className={cn(
                'relative flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft',
                chat._id === activeChatId && 'border-primary/50 ring-1 ring-ring bg-accent',
                unread > 0 && !chat._id === activeChatId && 'border-l-4 border-l-primary'
              )}
            >
              {unread > 0 && (
                <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-sm font-semibold text-white">
                {other?.avatar?.url ? (
                  <img src={other.avatar.url} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  getInitials(other?.name)
                )}
                {isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('truncate text-sm', unread > 0 ? 'font-bold' : 'font-semibold')}>
                    {other?.name || 'Unknown user'}
                  </span>
                  {chat.lastMessage?.sentAt && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {timeAgo(chat.lastMessage.sentAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'truncate text-xs',
                      unread > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {chat.lastMessage?.content || 'Say hello!'}
                  </span>
                  {unread > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 animate-fade-in items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                      {unread}
                    </span>
                  )}
                </div>
                {chat.room ? (
                  <span className="mt-0.5 flex items-center gap-1 truncate font-display text-[11px] italic text-muted-foreground">
                    <HomeIcon className="h-3 w-3 shrink-0 not-italic" />
                    {chat.room.title}
                  </span>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default ChatList;

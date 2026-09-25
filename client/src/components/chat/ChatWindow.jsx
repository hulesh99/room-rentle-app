import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  ArrowLeft,
  ChevronUp,
  Loader2,
  Phone,
  RotateCcw,
  Send,
  Video,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  useGetChatRoomsQuery,
  useGetMessagesQuery,
  useLazyGetOlderMessagesQuery,
  useSendMessageRestMutation,
} from '@/redux/slices/chatApiSlice';
import { setActiveChat, outgoingCallStarted } from '@/redux/slices/chatSlice';
import MessageBubble from '@/components/chat/MessageBubble';
import { getSocket } from '@/services/socket';
import axiosApi from '@/services/api';
import { cn } from '@/lib/utils';
import { getInitials } from '@/utils/helpers';

const formatDayLabel = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const DayDivider = ({ label }) => (
  <div className="my-4 flex items-center gap-3">
    <span className="h-px flex-1 bg-border" />
    <span className="rounded-full bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground shadow-sm">
      {label}
    </span>
    <span className="h-px flex-1 bg-border" />
  </div>
);

const ChatWindow = ({ chatId, onBack }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const typing = useSelector((state) => state.chat.typing);
  const onlineUserIds = useSelector((state) => state.chat.onlineUserIds);

  const { data: roomsData } = useGetChatRoomsQuery();
  const chat = useMemo(
    () => (roomsData?.data ?? []).find((c) => c._id === chatId),
    [roomsData, chatId]
  );

  const { data: messagesData, isLoading } = useGetMessagesQuery({ chatRoomId: chatId, page: 1 });
  const [fetchOlderMessages, { isFetching: loadingOlder }] = useLazyGetOlderMessagesQuery();
  const [sendMessageRest] = useSendMessageRestMutation();

  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [startingCall, setStartingCall] = useState(null);
  const [olderMessages, setOlderMessages] = useState([]);
  const [oldestPageLoaded, setOldestPageLoaded] = useState(1);
  const [pending, setPending] = useState([]);

  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const restoreScrollRef = useRef(null);
  const prevLengthRef = useRef(0);

  const latestMessages = messagesData?.data ?? [];
  const messages = useMemo(
    () => [...olderMessages, ...latestMessages],
    [olderMessages, latestMessages]
  );
  const totalPages = messagesData?.totalPages ?? 1;
  const hasMore = oldestPageLoaded < totalPages;
  const other = chat?.otherParticipant;
  const isOnline = Boolean(other && onlineUserIds.includes(String(other._id)));
  const peerTyping = Boolean(other && typing[`${chatId}:${other._id}`]);

  useEffect(() => {
    setOlderMessages([]);
    setOldestPageLoaded(1);
    setPending([]);
    prevLengthRef.current = 0;
    restoreScrollRef.current = null;
  }, [chatId]);

  useEffect(() => {
    dispatch(setActiveChat(chatId));
    getSocket()?.emit('chat_open', { chatId });
    getSocket()?.emit('message_seen', { chatId });
    return () => {
      getSocket()?.emit('chat_close', { chatId });
      dispatch(setActiveChat(null));
    };
  }, [chatId, dispatch]);

  useEffect(() => {
    if (restoreScrollRef.current && scrollRef.current) {
      const { prevHeight, prevTop } = restoreScrollRef.current;
      const el = scrollRef.current;
      el.scrollTop = el.scrollHeight - prevHeight + prevTop;
      restoreScrollRef.current = null;
      return;
    }
    if (messages.length > prevLengthRef.current || prevLengthRef.current === 0) {
      bottomRef.current?.scrollIntoView({
        behavior: prevLengthRef.current === 0 ? 'auto' : 'smooth',
      });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length, peerTyping]);

  useEffect(() => {
    if (loadingOlder) return;
    if (!restoreScrollRef.current || !scrollRef.current) return;
    const { prevHeight, prevTop } = restoreScrollRef.current;
    const el = scrollRef.current;
    el.scrollTop = el.scrollHeight - prevHeight + prevTop;
    restoreScrollRef.current = null;
  }, [loadingOlder]);

  const loadOlder = useCallback(async () => {
    if (!hasMore || loadingOlder) return;
    const el = scrollRef.current;
    restoreScrollRef.current = el
      ? { prevHeight: el.scrollHeight, prevTop: el.scrollTop }
      : null;
    const nextPage = oldestPageLoaded + 1;
    try {
      const result = await fetchOlderMessages({ chatRoomId: chatId, page: nextPage }, true).unwrap();
      const existingIds = new Set(messages.map((m) => m._id));
      const fresh = (result.data || []).filter((m) => !existingIds.has(m._id));
      setOlderMessages((prev) => [...fresh.reverse(), ...prev]);
      setOldestPageLoaded(nextPage);
    } catch {
      restoreScrollRef.current = null;
    }
  }, [hasMore, loadingOlder, oldestPageLoaded, fetchOlderMessages, chatId, messages]);

  const handleTyping = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('typing', { chatId, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { chatId, isTyping: false });
    }, 1500);
  };

  const dispatchMessage = async (trimmed) => {
    const socket = getSocket();
    if (socket?.connected) {
      await new Promise((resolve, reject) => {
        socket.emit('send_message', { chatId, content: trimmed }, (res) => {
          if (res?.success) resolve(res);
          else reject(new Error(res?.message || 'Failed to send'));
        });
      });
    } else {
      await sendMessageRest({ chatRoomId: chatId, content: trimmed }).unwrap();
    }
    getSocket()?.emit('message_seen', { chatId });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError('');
    setContent('');
    clearTimeout(typingTimeoutRef.current);
    getSocket()?.emit('typing', { chatId, isTyping: false });

    const tempId = `pending-${Date.now()}`;
    setPending((prev) => [...prev, { tempId, content: trimmed, status: 'sending' }]);

    try {
      await dispatchMessage(trimmed);
      setPending((prev) => prev.filter((p) => p.tempId !== tempId));
    } catch (err) {
      const msg = err?.message || err?.data?.message || 'Could not send message';
      setError(msg);
      toast.error(msg);
      setPending((prev) =>
        prev.map((p) => (p.tempId === tempId ? { ...p, status: 'failed' } : p))
      );
    } finally {
      setSending(false);
    }
  };

  const retryPending = async (tempId) => {
    const target = pending.find((p) => p.tempId === tempId);
    if (!target) return;
    setPending((prev) =>
      prev.map((p) => (p.tempId === tempId ? { ...p, status: 'sending' } : p))
    );
    setError('');
    try {
      await dispatchMessage(target.content);
      setPending((prev) => prev.filter((p) => p.tempId !== tempId));
    } catch (err) {
      setError(err?.message || err?.data?.message || 'Could not send message');
      setPending((prev) =>
        prev.map((p) => (p.tempId === tempId ? { ...p, status: 'failed' } : p))
      );
    }
  };

  const startCall = async (callType) => {
    if (!other || startingCall) return;
    setStartingCall(callType);
    setError('');
    try {
      const { data } = await axiosApi.post('/calls/initiate', {
        recipientId: other._id,
        callType,
      });
      dispatch(
        outgoingCallStarted({
          peer: data.data.recipient,
          channelName: data.data.channelName,
          callType,
        })
      );
      getSocket()?.emit('call_user', {
        toUserId: other._id,
        callerName: user.name,
        callerAvatar: user.avatar || null,
        callType,
        channelName: data.data.channelName,
        appId: data.data.appId,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start the call');
    } finally {
      setStartingCall(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b bg-background px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md p-1.5 hover:bg-accent sm:hidden"
          aria-label="Back to chats"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {other?.avatar?.url ? (
            <img src={other.avatar.url} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            getInitials(other?.name)
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{other?.name || 'Unknown user'}</p>
          <p className={cn('text-xs', isOnline ? 'text-emerald-600' : 'text-muted-foreground')}>
            {peerTyping ? 'typing...' : isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => startCall('audio')}
          disabled={Boolean(startingCall)}
          className="rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          aria-label="Voice call"
          title="Voice call"
        >
          {startingCall === 'audio' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Phone className="h-5 w-5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => startCall('video')}
          disabled={Boolean(startingCall)}
          className="rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          aria-label="Video call"
          title="Video call"
        >
          {startingCall === 'video' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Video className="h-5 w-5" />
          )}
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-4">
        {hasMore && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={loadOlder}
              disabled={loadingOlder}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
            >
              {loadingOlder ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" />
              )}
              Load earlier messages
            </button>
          </div>
        )}
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 && pending.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            No messages yet. Say hello!
          </p>
        ) : (
          <>
            {messages.map((message, i) => {
              const prev = messages[i - 1];
              const showDivider =
                !prev ||
                new Date(prev.createdAt).toDateString() !==
                  new Date(message.createdAt).toDateString();
              return (
                <Fragment key={message._id}>
                  {showDivider && <DayDivider label={formatDayLabel(message.createdAt)} />}
                  <MessageBubble
                    message={message}
                    isOwn={String(message.sender?._id || message.sender) === String(user.id)}
                  />
                </Fragment>
              );
            })}
            {pending.map((item) => (
              <div key={item.tempId} className="flex justify-end">
                <div
                  className={cn(
                    'group max-w-[75%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm shadow-sm',
                    item.status === 'failed'
                      ? 'border border-destructive/40 bg-destructive/10 text-destructive'
                      : 'bg-primary text-primary-foreground opacity-70'
                  )}
                >
                  <span className="block whitespace-pre-wrap break-words">{item.content}</span>
                  <span className="mt-1 flex items-center justify-end gap-1.5">
                    {item.status === 'failed' ? (
                      <>
                        <AlertCircle className="h-3 w-3" />
                        <span className="text-[10px] font-medium">Failed</span>
                        <button
                          type="button"
                          onClick={() => retryPending(item.tempId)}
                          className="inline-flex items-center gap-0.5 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-foreground transition-colors hover:text-primary"
                        >
                          <RotateCcw className="h-2.5 w-2.5" /> Retry
                        </button>
                      </>
                    ) : (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-[10px]">Sending</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
        {peerTyping && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-md bg-background px-4 py-3 shadow-sm">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="border-t border-destructive/20 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t bg-background p-3">
        <input
          className="h-11 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Type a message..."
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          maxLength={2000}
          aria-label="Message input"
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:bg-primary/90 disabled:opacity-40"
          aria-label="Send message"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;

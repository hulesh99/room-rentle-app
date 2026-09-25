import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/utils/formatDate';

const MessageBubble = ({ message, isOwn }) => (
  <div className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start')}>
    <div
      className={cn(
        'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
        isOwn
          ? 'rounded-br-md bg-primary text-primary-foreground'
          : 'rounded-bl-md bg-muted text-foreground'
      )}
    >
      <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
      <div
        className={cn(
          'mt-1 flex items-center justify-end gap-1 text-[10px]',
          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}
      >
        <span>{formatTime(message.createdAt)}</span>
        {isOwn &&
          (message.seen ? (
            <CheckCheck className="h-3.5 w-3.5 text-emerald-300" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          ))}
      </div>
    </div>
  </div>
);

export default MessageBubble;

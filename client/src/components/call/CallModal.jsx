import { Phone, PhoneOff, Video } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { callTerminated } from '@/redux/slices/chatSlice';
import { getSocket } from '@/services/socket';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/utils/helpers';

const CallModal = () => {
  const dispatch = useDispatch();
  const call = useSelector((state) => state.chat.call);

  if (call.status !== 'incoming') return null;

  const respond = (accepted) => {
    getSocket()?.emit('call_response', { toUserId: call.peer.id, accepted });
    if (!accepted) {
      dispatch(callTerminated());
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border bg-card p-8 text-center shadow-2xl">
        <div className="relative mx-auto mb-5 h-24 w-24">
          <span className="absolute inset-0 animate-ping rounded-full border-2 border-primary/50" />
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {call.peer.avatar?.url ? (
              <img src={call.peer.avatar.url} alt="" className="h-full w-full object-cover" />
            ) : (
              getInitials(call.peer.name)
            )}
          </div>
        </div>

        <h2 className="text-lg font-bold">{call.peer.name}</h2>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          {call.callType === 'video' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          Incoming {call.callType} call...
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            variant="destructive"
            size="lg"
            className="h-14 w-14 rounded-full p-0"
            onClick={() => respond(false)}
            aria-label="Reject call"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full bg-emerald-600 p-0 hover:bg-emerald-700"
            onClick={() => respond(true)}
            aria-label="Accept call"
          >
            <Phone className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;

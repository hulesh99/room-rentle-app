import { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { Mic, MicOff, PhoneOff, Video as VideoIcon, VideoOff, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  callConnected,
  callTerminated,
  setCallError,
} from '@/redux/slices/chatSlice';
import { getSocket } from '@/services/socket';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const VideoCallWindow = ({ appId }) => {
  const dispatch = useDispatch();
  const call = useSelector((state) => state.chat.call);

  const clientRef = useRef(null);
  const localTracksRef = useRef([]);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const endedNotifiedRef = useRef(false);

  const [phase, setPhase] = useState('joining');
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(call.callType === 'video');
  const [elapsed, setElapsed] = useState(0);

  const peer = call.peer || {};
  const isDeclined = call.status === 'declined';

  const endCall = (notifyPeer = true) => {
    if (notifyPeer && !endedNotifiedRef.current) {
      endedNotifiedRef.current = true;
      getSocket()?.emit('call_ended', { toUserId: peer.id });
    }
    localTracksRef.current.forEach((track) => track?.close());
    localTracksRef.current = [];
    clientRef.current?.leave().catch(() => {});
    clientRef.current = null;
    dispatch(callTerminated());
  };

  useEffect(() => {
    if (isDeclined) {
      const timer = setTimeout(() => endCall(false), 2500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isDeclined]);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      try {
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        client.on('user-published', async (remoteUser, mediaType) => {
          await client.subscribe(remoteUser, mediaType);
          if (mediaType === 'video') {
            remoteUser.videoTrack?.play(remoteVideoRef.current);
          }
          if (mediaType === 'audio') {
            remoteUser.audioTrack?.play();
          }
          if (!cancelled) setRemoteUsers((prev) => [...new Map([...prev, [remoteUser.uid, remoteUser]]).values()]);
        });

        client.on('user-unpublished', (remoteUser) => {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== remoteUser.uid));
        });

        client.on('user-left', (remoteUser) => {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== remoteUser.uid));
        });

        await client.join(appId, call.channelName, null, null);
        if (cancelled) return;

        const tracks = [await AgoraRTC.createMicrophoneAudioTrack()];
        if (call.callType === 'video') {
          tracks.push(await AgoraRTC.createCameraVideoTrack());
        }
        await client.publish(tracks);
        localTracksRef.current = tracks;
        if (cancelled) return;

        if (call.callType === 'video' && localVideoRef.current) {
          tracks[1].play(localVideoRef.current);
        }

        dispatch(callConnected());
        setPhase('active');
      } catch (err) {
        if (!cancelled) {
          dispatch(setCallError(err?.message || 'Could not connect the call'));
          setPhase('error');
        }
      }
    };

    if (!isDeclined && ['ringing', 'connecting'].includes(call.status)) {
      setup();
    } else if (call.status === 'incoming') {
      setPhase('waiting');
    }

    return () => {
      cancelled = true;
      localTracksRef.current.forEach((track) => track?.close());
      localTracksRef.current = [];
      clientRef.current?.leave().catch(() => {});
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== 'active') return undefined;
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const toggleMic = () => {
    const track = localTracksRef.current.find((t) => t.trackMediaType === 'audio');
    if (!track) return;
    const next = !micOn;
    track.setEnabled(next);
    setMicOn(next);
  };

  const toggleCam = () => {
    const track = localTracksRef.current.find((t) => t.trackMediaType === 'video');
    if (!track) return;
    const next = !camOn;
    track.setEnabled(next);
    setCamOn(next);
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-950 text-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="font-semibold">{peer.name || 'Unknown'}</p>
          <p className="text-xs text-white/60">
            {phase === 'error'
              ? call.error || 'Connection problem'
              : phase === 'joining'
                ? 'Connecting...'
                : isDeclined
                  ? 'Call declined'
                  : phase === 'active'
                    ? `${mm}:${ss}`
                    : 'Waiting...'}
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide">
          {call.callType} call
        </span>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div ref={remoteVideoRef} className="h-full w-full [&>div]:h-full [&>div]:w-full" />

        {remoteUsers.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900/60">
            {phase === 'joining' ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-white/70" />
                <p className="text-sm text-white/70">Connecting to {peer.name}...</p>
              </>
            ) : (
              <>
                <span
                  className={cn(
                    'flex h-24 w-24 items-center justify-center rounded-full bg-primary text-2xl font-bold',
                    !isDeclined && phase !== 'error' && 'animate-pulse'
                  )}
                >
                  {(peer.name || '?').charAt(0).toUpperCase()}
                </span>
                <p className="text-sm text-white/70">
                  {isDeclined
                    ? 'Call was declined'
                    : phase === 'error'
                      ? call.error
                      : `Ringing ${peer.name}...`}
                </p>
              </>
            )}
          </div>
        )}

        {call.callType === 'video' && (
          <div
            ref={localVideoRef}
            className="absolute bottom-4 right-4 h-40 w-32 overflow-hidden rounded-lg border border-white/20 bg-zinc-800 shadow-xl md:h-48 md:w-36 [&>div]:h-full [&>div]:w-full"
          />
        )}

        {call.callType === 'audio' && remoteUsers.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="flex h-28 w-28 items-center justify-center rounded-full bg-primary text-3xl font-bold animate-pulse">
              {(peer.name || '?').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 py-6">
        <button
          type="button"
          onClick={toggleMic}
          disabled={phase !== 'active'}
          aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
          className={cn(
            'flex items-center justify-center rounded-full p-3.5 transition-colors disabled:opacity-50',
            micOn ? 'bg-white/15 hover:bg-white/25' : 'bg-white text-zinc-900'
          )}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

        {call.callType === 'video' && (
          <button
            type="button"
            onClick={toggleCam}
            disabled={phase !== 'active'}
            aria-label={camOn ? 'Turn camera off' : 'Turn camera on'}
            className={cn(
              'flex items-center justify-center rounded-full p-3.5 transition-colors disabled:opacity-50',
              camOn ? 'bg-white/15 hover:bg-white/25' : 'bg-white text-zinc-900'
            )}
          >
            {camOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
        )}

        <Button
          variant="destructive"
          size="lg"
          className="h-14 w-14 rounded-full p-0"
          onClick={() => endCall()}
          aria-label="End call"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default VideoCallWindow;

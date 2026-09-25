import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axiosApi from '@/services/api';
import VideoCallWindow from '@/components/call/VideoCallWindow';
import CallModal from '@/components/call/CallModal';

let cachedAppId = '';

const CallLayer = () => {
  const dispatch = useDispatch();
  const call = useSelector((state) => state.chat.call);
  const isAuthenticated = useSelector((state) => Boolean(state.auth.user));

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;
    axiosApi
      .get('/calls/config')
      .then(({ data }) => {
        if (active) cachedAppId = data.data.appId;
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated || call.status === 'idle') return null;

  return (
    <>
      <CallModal />
      {['ringing', 'connecting', 'active', 'declined'].includes(call.status) && (
        <VideoCallWindow appId={cachedAppId} />
      )}
    </>
  );
};

export default CallLayer;

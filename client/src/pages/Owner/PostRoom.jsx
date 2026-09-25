import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useCreateRoomMutation } from '@/redux/slices/roomsApiSlice';
import RoomForm from '@/components/room/RoomForm';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';

const PostRoom = () => {
  const navigate = useNavigate();
  const [createRoom, { isLoading }] = useCreateRoomMutation();
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (formData) => {
    setServerError('');
    try {
      await createRoom(formData).unwrap();
    toast.success('Listing published');
      navigate('/owner/dashboard', { replace: true });
    } catch (err) {
      setServerError(
        typeof err === 'string' ? err : err?.data?.message || 'Could not publish listing'
      );
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Post a new room</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Fill in the details below. Your listing goes live immediately after publishing.
      </p>

      <div className="mt-8">
        <RoomForm mode="create" submitting={isLoading} serverError={serverError} onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default PostRoom;

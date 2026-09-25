import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  useGetRoomByIdQuery,
  useUpdateRoomMutation,
} from '@/redux/slices/roomsApiSlice';
import RoomForm from '@/components/room/RoomForm';
import EmptyState from '@/components/common/EmptyState';
import { FormSkeleton } from '@/components/common/Skeletons';

const EditRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetRoomByIdQuery(id);
  const [updateRoom, { isLoading: saving }] = useUpdateRoomMutation();
  const [serverError, setServerError] = useState('');

  const room = data?.data?.room;
  const isOwner = data?.data?.isOwner;

  const handleSubmit = async (formData) => {
    setServerError('');
    try {
      await updateRoom({ id, formData }).unwrap();
      toast.success('Changes saved');
      navigate('/owner/dashboard', { replace: true });
    } catch (err) {
      const msg =
        typeof err === 'string' ? err : err?.data?.message || 'Could not save changes';
      setServerError(msg);
      toast.error(msg);
    }
  };

  if (isLoading) return <div className="py-10"><FormSkeleton /></div>;

  if (isError || !room || !isOwner) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          title="Listing not found"
          description="This listing does not exist or does not belong to you."
        >
          <Link to="/owner/dashboard" className="text-sm font-medium text-primary hover:underline">
            Back to dashboard
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        to="/owner/dashboard"
        className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Edit listing</h1>
      <p className="mt-1 text-sm text-muted-foreground">{room.title}</p>

      <div className="mt-8">
        <RoomForm
          key={room._id}
          mode="edit"
          initial={room}
          submitting={saving}
          serverError={serverError}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default EditRoom;

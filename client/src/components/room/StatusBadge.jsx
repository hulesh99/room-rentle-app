import { Badge } from '@/components/ui/badge';
import { prettyLabel } from '@/utils/format';

const STATUS_VARIANTS = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'secondary',
  AVAILABLE: 'success',
  BOOKED: 'destructive',
};

const StatusBadge = ({ status }) => (
  <Badge variant={STATUS_VARIANTS[status] || 'outline'}>{prettyLabel(status)}</Badge>
);

export default StatusBadge;

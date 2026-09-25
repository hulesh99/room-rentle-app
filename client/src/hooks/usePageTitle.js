import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | RoomRental` : 'RoomRental';
  }, [title]);
}

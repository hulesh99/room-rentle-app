import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const LINK_GROUPS = [
  {
    title: 'Explore',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Browse Rooms', to: '/rooms' },
      { label: 'Sign in', to: '/login' },
      { label: 'Create account', to: '/register' },
    ],
  },
  {
    title: 'For Owners',
    links: [
      { label: 'Post a Room', to: '/owner/post-room' },
      { label: 'Dashboard', to: '/owner/dashboard' },
      { label: 'Booking Requests', to: '/owner/requests' },
    ],
  },
  {
    title: 'For Renters',
    links: [
      { label: 'Wishlist', to: '/wishlist' },
      { label: 'My Requests', to: '/renter/requests' },
      { label: 'Dashboard', to: '/renter/dashboard' },
    ],
  },
];

const Footer = () => (
  <footer className="border-t bg-emerald-950 text-emerald-50">
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-emerald-600 to-teal-500 text-white shadow-glow">
              <Home className="h-[18px] w-[18px]" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              Room<span className="italic text-emerald-300">Rental</span>
            </span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-emerald-100/70">
            Find rooms, PGs and flats, or list your property. Real-time chat, secure booking
            requests and zero brokerage.
          </p>
        </div>

        {LINK_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              {group.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-emerald-100/70 transition-colors hover:text-emerald-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-emerald-100/15 pt-6 sm:flex-row">
        <p className="text-xs text-emerald-100/60">
          &copy; {new Date().getFullYear()} RoomRental. All rights reserved.
        </p>
        <p className="font-display text-xs italic text-emerald-200/80">
          Find rooms. List rooms. Connect instantly.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;

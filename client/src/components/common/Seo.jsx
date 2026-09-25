import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'RoomRental';
const DEFAULT_DESCRIPTION =
  'Find rooms, PGs and flats, or list your property with real-time chat and instant booking requests.';
const DEFAULT_IMAGE = '/og-image.png';

const Seo = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  type = 'website',
  path,
  noIndex = false,
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Find Rooms & List Your Property`;
  const canonical = path ? `${origin}${path}` : typeof window !== 'undefined' ? window.location.href : origin;
  const imageUrl = image?.startsWith('http') ? image : `${origin}${image}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={imageUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
};

export default Seo;

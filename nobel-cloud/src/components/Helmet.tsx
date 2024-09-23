import { Helmet as HelmetLib } from 'react-helmet-async';

const siteName = 'Nobel POC';

interface Props {
  title?: string;
}

export default function Helmet({ title }: Props) {
  return (
    <HelmetLib>
      <title>
        {title && `${title} | `}
        {siteName}
      </title>
    </HelmetLib>
  );
}

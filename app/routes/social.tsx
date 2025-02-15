import { PageLayout } from '~/components/layout';

function SocialMedia() {
  return <PageLayout title="Media" links={[{ to: 'feed', label: 'Feed' }]} />;
}

export default SocialMedia;

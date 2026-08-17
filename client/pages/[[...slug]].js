import dynamic from 'next/dynamic';

const Root = dynamic(() => import('../src/Root'), { ssr: false });

export default function SlugPage() {
  return <Root />;
}

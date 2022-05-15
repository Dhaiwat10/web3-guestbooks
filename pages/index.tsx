import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

const Home: NextPage = () => {
  const { data, isLoading } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [verified, setVerified] = useState(false);

  const createGuestbook = async () => {
    try {
      const message = `I am verifying my identity with the following address: ${data?.address}`;
      const signature = await signMessageAsync({ message });
      const verifyRes = await fetch(`/api/verify`, {
        method: 'POST',
        body: JSON.stringify({
          signature,
          address: data?.address,
        }),
      });
      if (verifyRes.status === 200) {
        setVerified(true);
        const res = await fetch(`/api/guestbook`, {
          method: 'POST',
          body: JSON.stringify({
            address: data?.address,
          }),
        });
        console.log(await res.json());
      } else {
        setVerified(false);
        alert('Verification failed');
      }
    } catch (error) {
      alert('Error signing message');
      console.error({ error });
    }
  };

  return (
    <main>
      <div className='flex flex-col'>
        <ConnectButton showBalance={false} />

        {!isLoading && (
          <button disabled={!data} onClick={createGuestbook}>
            {data
              ? 'Create your Guestbook!'
              : 'Create your Guestbook! (Connect your wallet first)'}
          </button>
        )}
      </div>
    </main>
  );
};

export default Home;

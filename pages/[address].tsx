import { fetchEntries } from '@/utils/db';
import { Entry } from '@/utils/types';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { NextPage, NextPageContext } from 'next';
import { useAccount, useConnect, useEnsName, useSignMessage } from 'wagmi';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Blockies from 'react-blockies';

interface PageProps {
  entries: Entry[];
  ens?: string | null;
}

const Page: NextPage<PageProps> = ({ entries }) => {
  const router = useRouter();
  const receiver = router.query.address;
  const { isConnected } = useConnect();
  const { data } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { data: ens } = useEnsName({ address: receiver as string });
  const [isSigning, setIsSigning] = useState(false);

  const [latestEntries, setLatestEntries] = useState<Entry[]>(entries);

  const handleSign = async () => {
    setIsSigning(true);
    try {
      if (!isConnected) {
        return toast.error('You need to connect your wallet first!');
      }
      const message = 'gm';
      const signature = await signMessageAsync({ message });
      if (!signature) {
        return toast.error('Something went wrong!');
      }
      const res = await axios.post('/api/guestbook', {
        signature,
        message,
        receiver,
        signer: data?.address,
      });
      if (res.status === 200) {
        toast.success('Successfully signed!');
        const newEntries = [...latestEntries, res.data.data];
        console.log({ newEntries });
        setLatestEntries(newEntries);
      } else {
        toast.error('Something went wrong!');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message as string);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <main className='text-center'>
      <Toaster />
      <div className='flex flex-col'>
        <ConnectButton showBalance={false} />
        <h1>{ens || receiver}'s guestbook!</h1>
        <ul className='flex flex-col gap-4'>
          {latestEntries.map((entry) => (
            <li
              className='border border-slate-200 p-4 rounded flex gap-2 justify-center'
              key={entry.id}
            >
              <Blockies seed={entry.signer} />
              <h2>{entry.signer}</h2>
            </li>
          ))}
        </ul>

        <button
          disabled={isSigning}
          className='p-2 rounded bg-slate-100 mt-4'
          onClick={handleSign}
        >
          Sign my guestbook
        </button>
      </div>
    </main>
  );
};

export async function getServerSideProps(context: NextPageContext) {
  const entries = await fetchEntries(context.query.address as string);

  return {
    props: {
      entries,
    },
  };
}

export default Page;

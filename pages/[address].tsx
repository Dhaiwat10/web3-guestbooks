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
import { getTruncatedAddress } from '@/utils';
import { ethers } from 'ethers';

interface PageProps {
  entries: Entry[];
  receiver: string;
}

const Page: NextPage<PageProps> = ({ entries, receiver }) => {
  const router = useRouter();
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
        <div className='flex justify-center mt-8 mb-8'>
          <ConnectButton showBalance={false} />
        </div>

        <h1 className='text-2xl font-bold'>{ens || receiver}'s guestbook!</h1>
        <h3 className='text-slate-500'>
          These people signed the guestbook and said <i>gm</i>
        </h3>

        <ul className='flex flex-col gap-4 mt-8'>
          {latestEntries.map((entry) => (
            <Account key={entry.id} address={entry.signer} />
          ))}
        </ul>

        <button
          disabled={isSigning}
          className='py-2 px-4 rounded text-white bg-blue-900 mt-8 w-fit mx-auto font-bold'
          onClick={handleSign}
        >
          Sign my guestbook
        </button>
      </div>
    </main>
  );
};

const Account = ({ address }: { address: string }) => {
  const { data: ens } = useEnsName({ address });

  return (
    <li className='border border-slate-200 p-4 rounded flex gap-2 justify-center w-fit mx-auto hover:shadow'>
      <Blockies seed={address} className='rounded' />
      <h2>{ens || getTruncatedAddress(address)}</h2>
    </li>
  );
};

export async function getServerSideProps(context: NextPageContext) {
  const provider = ethers.getDefaultProvider();
  const address = await provider.resolveName(context.query.address as string);
  console.log({ address });
  const entries = await fetchEntries(
    address || (context.query.address as string)
  );

  return {
    props: {
      entries,
      receiver: address || (context.query.address as string),
    },
  };
}

export default Page;

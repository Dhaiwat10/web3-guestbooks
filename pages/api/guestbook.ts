import { checkForExistingEntry, createEntry, fetchEntries } from '@/utils/db';
import { verifyMessage } from 'ethers/lib/utils';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  if (method === 'GET') {
    const { address } = req.query;
    const entries = fetchEntries(address as string);
    return res.status(200).json({
      entries,
    });
  }

  if (method === 'POST') {
    const { signature, message, signer, receiver } = req.body;
    const alreadyExists = await checkForExistingEntry(receiver, signer);
    if (alreadyExists) {
      return res.status(400).json({ error: 'Entry already exists' });
    }
    const recoveredAddress = verifyMessage(message, signature);
    if (recoveredAddress !== signer) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    const { data, error } = await createEntry({
      receiver,
      signer,
      signature,
      message,
    });
    if (!data || error) {
      return res.status(500).json({ error });
    }
    return res.status(200).json({ data: data[0] });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${method} Not Allowed`);
}

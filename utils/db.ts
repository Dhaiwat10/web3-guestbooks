import { createClient } from '@supabase/supabase-js';
import { Entry } from './types';

export const createSupabaseClient = () => {
  return createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_KEY as string
  );
};

export const fetchEntries = async (receiver: string) => {
  const db = createSupabaseClient();
  const { data } = await db
    .from('entries')
    .select('*')
    .filter('receiver', 'eq', receiver)
    .order('created_at');
  return data;
};

export const createEntry = async (entry: Omit<Entry, 'created_at' | 'id'>) => {
  try {
    const db = createSupabaseClient();
    const { data, error } = await db.from('entries').insert(entry);
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const checkForExistingEntry = async (
  receiver: string,
  signer: string
) => {
  const db = createSupabaseClient();
  const { data, error } = await db
    .from('entries')
    .select('*')
    .filter('receiver', 'eq', receiver)
    .filter('signer', 'eq', signer);

  if (!data || error) {
    return false;
  }

  return data.length > 0;
};

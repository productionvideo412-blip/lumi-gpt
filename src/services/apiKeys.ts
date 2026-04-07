import { supabase } from "@/integrations/supabase/client";

export interface ApiKeys {
  groq: string;
  openrouter: string;
  huggingface: string;
  replicate: string;
}

const STORAGE_KEY = "lumi_api_keys";

export function getLocalApiKeys(): ApiKeys {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { groq: "", openrouter: "", huggingface: "", replicate: "" };
}

export function setLocalApiKeys(keys: Partial<ApiKeys>) {
  const current = getLocalApiKeys();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...keys }));
}

export async function getApiKeysFromDB(): Promise<ApiKeys> {
  const keys: ApiKeys = { groq: "", openrouter: "", huggingface: "", replicate: "" };
  const { data } = await supabase.from("api_settings").select("provider, api_key").eq("is_active", true);
  if (data) {
    for (const row of data as any[]) {
      if (row.provider in keys) {
        (keys as any)[row.provider] = row.api_key;
      }
    }
  }
  return keys;
}

export async function resolveApiKey(provider: keyof ApiKeys): Promise<string> {
  // First check localStorage (user-provided)
  const local = getLocalApiKeys();
  if (local[provider]) return local[provider];

  // Then check DB (admin-set)
  const db = await getApiKeysFromDB();
  if (db[provider]) return db[provider];

  return "";
}

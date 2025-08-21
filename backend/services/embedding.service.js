import { logger } from '../utils/logger.js';

const MODEL = process.env.HF_EMBED_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';
const ENABLE = process.env.ENABLE_EMBED_RERANK === '1';

let clientPromise = null;
async function getClient() {
  if (!ENABLE || !process.env.HF_API_TOKEN) return null;
  if (!clientPromise) {
    clientPromise = (async () => {
      try {
        const mod = await import('@huggingface/inference');
        const { HfInference } = mod;
        return new HfInference(process.env.HF_API_TOKEN);
      } catch (e) {
        logger.warn({ err: e.message }, 'HuggingFace inference package not available; disabling embed rerank');
        return null;
      }
    })();
  }
  return clientPromise;
}

export async function embedTexts(texts=[]) {
  if (!ENABLE) return [];
  const client = await getClient();
  if (!client) return [];
  try {
    const res = await client.featureExtraction({ model: MODEL, inputs: texts });
    return Array.isArray(res[0]) ? res : [res];
  } catch (e) {
    logger.warn({ err: e.message }, 'Embedding failed');
    return [];
  }
}

export function cosine(a,b){
  let dot=0,na=0,nb=0; for(let i=0;i<a.length;i++){dot+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];}
  return dot/(Math.sqrt(na)*Math.sqrt(nb)||1);
}

export async function rerankByEmbedding(profile, universities){
  if (!ENABLE) return universities;
  if (universities.length < 2) return universities;
  const profileText = buildProfileQuery(profile);
  const uniTexts = universities.map(u=> `${u.name} ${u.location.city} ${u.location.state} ${u.keyFeatures.slice(0,3).join(' ')}`);
  const vectors = await embedTexts([profileText, ...uniTexts]);
  if (vectors.length !== uniTexts.length+1) return universities; // failed
  const q = vectors[0];
  const scored = universities.map((u,i)=> ({ ...u, _embedScore: cosine(q, vectors[i+1]) }));
  return scored.sort((a,b)=> (b._embedScore||0) - (a._embedScore||0));
}

function buildProfileQuery(p){
  if (!p) return '';
  const parts = [];
  if (p.academics?.grade12Score) parts.push(`grade:${p.academics.grade12Score}`);
  if (p.interests?.fieldOfStudy) parts.push(`field:${p.interests.fieldOfStudy}`);
  if (p.preferences?.priorities?.length) parts.push(`priorities:${p.preferences.priorities.join(',')}`);
  if (p.preferences?.locations?.length) parts.push(`loc:${p.preferences.locations.join(',')}`);
  return parts.join(' | ');
}

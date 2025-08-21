export async function withTimeout(promise, ms, message='Operation timed out') {
  let to;
  const timeout = new Promise((_, reject)=>{ to = setTimeout(()=>reject(new Error(message)), ms); });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(to);
  }
}

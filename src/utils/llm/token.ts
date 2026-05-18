// Approximation: ~4 chars per token (cl100k_base average for English/code)
// Accurate enough for context-window threshold checks; avoids bundling js-tiktoken (5MB+)
export function tokenCount(text: string): Promise<number> {
  return Promise.resolve(Math.ceil(text.length / 4))
}

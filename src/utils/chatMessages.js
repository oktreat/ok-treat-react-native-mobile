// The API returns the newest page first. Render chat history oldest first so
// scrollToEnd lands on the newest message, including after a socket update.
export function chronologicalMessages(messages) {
  return [...messages].sort((a, b) => {
    const aTime = Date.parse(a.createdAt) || 0;
    const bTime = Date.parse(b.createdAt) || 0;
    return aTime - bTime;
  });
}

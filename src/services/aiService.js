import { client, unwrap } from './platformService.js';
export const aiService = {
  open: (scenarioId, newConversation = false) =>
    unwrap(client().rpc('open_conversation', { p_scenario: scenarioId, p_new: newConversation })),
  messages: (sessionId) =>
    unwrap(
      client().from('conversation_messages').select('*').eq('session_id', sessionId).order('id'),
    ),
  async respond({ sessionId, message, requestId }) {
    const { data, error } = await client().functions.invoke('ai-conversation', {
      body: { sessionId, message, requestId },
    });
    if (error) {
      let detail;
      try {
        detail = await error.context?.json();
      } catch {
        /* Network responses may not have JSON. */
      }
      throw new Error(
        detail?.error ||
          'AI connection failed. Deploy the ai-conversation Edge Function and configure its secrets.',
      );
    }
    if (data?.error) throw new Error(data.error);
    return data;
  },
};

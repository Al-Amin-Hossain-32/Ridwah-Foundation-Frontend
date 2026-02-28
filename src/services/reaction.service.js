// ─── reaction.service.js ──────────────────────────────────────────────────────
import api from './api';

const reactionService = {
  /**
   * Toggle reaction on post/comment/reply
   * @param {string} targetType - 'post' | 'comment' | 'reply'
   * @param {string} targetId
   * @param {string} reactionType - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   */
  toggle: (targetType, targetId, reactionType) =>
    api.post(`/reactions/${targetType}/${targetId}`, { reactionType }),

  getReactions: (targetType, targetId) =>
    api.get(`/reactions/${targetType}/${targetId}`),

  getReactors: (targetType, targetId, reactionType = null, limit = 20) =>
  api.get(`/reactions/${targetType}/${targetId}/reactors`, {
    params: { ...(reactionType && { type: reactionType }), limit }
  }),
};


export default reactionService;


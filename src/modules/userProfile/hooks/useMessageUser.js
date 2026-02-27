import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import messageService from '@/services/message.service';

/**
 * useMessageUser
 * 
 * একটা dummy message পাঠিয়ে conversation তৈরি/খুঁজে নেয়
 * তারপর সেই conversation-এ navigate করে
 */
const useMessageUser = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const openChat = async (userId) => {
    if (!userId) return;
    setLoading(true);

    try {
      const res = await messageService.send({
        receiverId: userId,
        content: '👋',
      });

      // আপনার backend result.conversation._id দেয়
      const conversationId =
        res.data?.data?.conversation?._id ??
        res.data?.data?.message?.conversation ??
        null;

      if (!conversationId) throw new Error('Conversation ID পাওয়া যায়নি');

      navigate(`/app/chat/${conversationId}`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'চ্যাট খুলতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return { openChat, loading };
};

export default useMessageUser;
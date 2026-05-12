import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/api/client';
import { MessageSquare, Reply, Send, Trash2, Edit2 } from 'lucide-react';
import type { Comment } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface CommentsSectionProps {
  topicId: string;
}

export function CommentsSection({ topicId }: CommentsSectionProps) {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [editContent, setEditContent] = useState('');
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ['comments', topicId],
    queryFn: async () => {
      const response = await api.get(`/topics/${topicId}/comments`);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { content: string; parent_id?: string }) => {
      const response = await api.post(`/topics/${topicId}/comments`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', topicId] });
      setNewComment('');
      setReplyTo(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const response = await api.put(`/topics/comments/${commentId}`, { content, topic_id: topicId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', topicId] });
      setEditingId(null);
      setEditContent('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/topics/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', topicId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createMutation.mutate({ content: newComment, parent_id: replyTo || undefined });
  };

  const handleReply = (commentId: string) => {
    setReplyTo(commentId);
    setNewComment('');
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdate = (commentId: string) => {
    if (!editContent.trim()) return;
    updateMutation.mutate({ commentId, content: editContent });
  };

  const handleDelete = (commentId: string) => {
    if (confirm('Удалить комментарий?')) {
      deleteMutation.mutate(commentId);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwnComment = comment.user_id === localStorage.getItem('userId');

    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ml-12 mt-3' : 'mb-4'} p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg`}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-primary">
              {comment.user?.name?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                {comment.user?.name || 'Аноним'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ru })}
              </span>
            </div>

            {editingId === comment.id ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm resize-none"
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleUpdate(comment.id)}
                    className="px-3 py-1 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                {comment.content}
              </p>
            )}

            <div className="flex gap-2 mt-2">
              {!isReply && (
                <button
                  onClick={() => handleReply(comment.id)}
                  className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary"
                >
                  <Reply className="w-3 h-3" />
                  Ответить
                </button>
              )}
              {isOwnComment && (
                <>
                  <button
                    onClick={() => handleEdit(comment)}
                    className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary"
                  >
                    <Edit2 className="w-3 h-3" />
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                    Удалить
                  </button>
                </>
              )}
            </div>

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">
                {comment.replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="card p-6 mt-6">
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Обсуждение</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({comments?.length || 0} комментариев)
        </span>
      </div>

      {replyTo && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-700 dark:text-blue-300">Ответ на комментарий</span>
          <button
            onClick={() => setReplyTo(null)}
            className="text-blue-700 dark:text-blue-300 hover:underline"
          >
            Отмена
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={replyTo ? 'Напишите ответ...' : 'Задайте вопрос или поделитесь мнением...'}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!newComment.trim() || createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {createMutation.isPending ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg animate-pulse">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => renderComment(comment))}
        </div>
      ) : (
        <p className="text-center py-8 text-gray-500 dark:text-gray-400">
          Пока нет комментариев. Будьте первым!
        </p>
      )}
    </div>
  );
}

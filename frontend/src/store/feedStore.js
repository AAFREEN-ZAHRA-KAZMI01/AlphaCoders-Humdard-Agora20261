import { create } from 'zustand'
import * as postsApi from '../api/posts'

export const useFeedStore = create((set, get) => ({
  posts: [],
  page: 1,
  total: 0,
  hasMore: true,
  isLoading: false,
  error: null,

  fetchPosts: async (reset = false) => {
    if (get().isLoading) return
    set({ isLoading: true, error: null })
    try {
      const nextPage = reset ? 1 : get().page
      const { data } = await postsApi.getFeed(nextPage, 20)
      set((s) => ({
        posts: reset ? data.items : [...s.posts, ...data.items],
        page: nextPage + 1,
        total: data.total,
        hasMore: nextPage < data.pages,
        isLoading: false,
      }))
    } catch (err) {
      set({ isLoading: false, error: err.message })
    }
  },

  addPost: (post) =>
    set((s) => ({ posts: [post, ...s.posts], total: s.total + 1 })),

  updatePost: (postId, updates) =>
    set((s) => ({ posts: s.posts.map((p) => (p.id === postId ? { ...p, ...updates } : p)) })),

  removePost: (postId) =>
    set((s) => ({ posts: s.posts.filter((p) => p.id !== postId), total: Math.max(0, s.total - 1) })),
}))

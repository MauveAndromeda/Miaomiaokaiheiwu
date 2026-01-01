'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// API 请求状态
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

// 通用 API Hook 返回类型
export interface UseApiResult<T> {
  data: T | null;
  status: RequestStatus;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  reset: () => void;
}

// 配置选项
interface UseApiOptions {
  /** 是否立即执行 */
  immediate?: boolean;
  /** 重试次数 */
  retryCount?: number;
  /** 重试延迟(ms) */
  retryDelay?: number;
  /** 缓存时间(ms) */
  cacheTime?: number;
  /** 成功回调 */
  onSuccess?: (data: any) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
}

// 简单内存缓存
const cache = new Map<string, { data: any; timestamp: number }>();

/**
 * 通用 API 请求 Hook
 */
export function useApi<T>(
  fetcher: () => Promise<{ success: boolean; data?: T; error?: string }>,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const {
    immediate = true,
    retryCount = 0,
    retryDelay = 1000,
    cacheTime = 0,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);

  const execute = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetcher();

      if (!mountedRef.current) return;

      if (response.success && response.data !== undefined) {
        setData(response.data);
        setStatus('success');
        retryCountRef.current = 0;
        onSuccess?.(response.data);
      } else {
        throw new Error(response.error || '请求失败');
      }
    } catch (err) {
      if (!mountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : '未知错误';

      // 重试逻辑
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        setTimeout(execute, retryDelay);
        return;
      }

      setError(errorMessage);
      setStatus('error');
      onError?.(errorMessage);
    }
  }, [fetcher, retryCount, retryDelay, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setStatus('idle');
    setError(null);
    retryCountRef.current = 0;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (immediate) {
      execute();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [immediate, execute]);

  return {
    data,
    status,
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
    error,
    refetch: execute,
    reset,
  };
}

/**
 * 分页数据 Hook
 */
interface UsePaginationOptions<T> extends UseApiOptions {
  pageSize?: number;
  initialPage?: number;
}

interface UsePaginationResult<T> extends Omit<UseApiResult<T[]>, 'data'> {
  items: T[];
  page: number;
  hasMore: boolean;
  total: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  isLoadingMore: boolean;
  isRefreshing: boolean;
}

export function usePagination<T>(
  fetcher: (params: { page: number; pageSize: number }) => Promise<{
    success: boolean;
    data?: { items: T[]; total: number; hasMore: boolean };
    error?: string;
  }>,
  options: UsePaginationOptions<T> = {}
): UsePaginationResult<T> {
  const { pageSize = 10, initialPage = 1, immediate = true, ...restOptions } = options;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const mountedRef = useRef(true);

  const loadPage = useCallback(async (pageNum: number, isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else if (pageNum > 1) {
      setIsLoadingMore(true);
    } else {
      setStatus('loading');
    }

    try {
      const response = await fetcher({ page: pageNum, pageSize });

      if (!mountedRef.current) return;

      if (response.success && response.data) {
        const { items: newItems, total: newTotal, hasMore: more } = response.data;

        if (isRefresh || pageNum === 1) {
          setItems(newItems);
        } else {
          setItems(prev => [...prev, ...newItems]);
        }

        setTotal(newTotal);
        setHasMore(more);
        setPage(pageNum);
        setStatus('success');
        setError(null);
      } else {
        throw new Error(response.error || '加载失败');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      setStatus('error');
    } finally {
      if (mountedRef.current) {
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    }
  }, [fetcher, pageSize]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || status === 'loading') return;
    await loadPage(page + 1);
  }, [hasMore, isLoadingMore, status, page, loadPage]);

  const refresh = useCallback(async () => {
    await loadPage(1, true);
  }, [loadPage]);

  const refetch = useCallback(async () => {
    await loadPage(page);
  }, [loadPage, page]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setTotal(0);
    setStatus('idle');
    setError(null);
  }, [initialPage]);

  useEffect(() => {
    mountedRef.current = true;

    if (immediate) {
      loadPage(1);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [immediate, loadPage]);

  return {
    items,
    page,
    hasMore,
    total,
    status,
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
    error,
    loadMore,
    refresh,
    refetch,
    reset,
    isLoadingMore,
    isRefreshing,
  };
}

/**
 * 防抖搜索 Hook
 */
export function useDebounceSearch<T>(
  searcher: (keyword: string) => Promise<{ success: boolean; data?: T; error?: string }>,
  delay = 300
) {
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [data, setData] = useState<T | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout>();

  const search = useCallback((value: string) => {
    setKeyword(value);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!value.trim()) {
      setDebouncedKeyword('');
      setData(null);
      return;
    }

    timerRef.current = setTimeout(() => {
      setDebouncedKeyword(value);
    }, delay);
  }, [delay]);

  useEffect(() => {
    if (!debouncedKeyword) return;

    let mounted = true;
    setIsSearching(true);

    searcher(debouncedKeyword)
      .then(response => {
        if (!mounted) return;
        if (response.success) {
          setData(response.data ?? null);
          setError(null);
        } else {
          setError(response.error || '搜索失败');
        }
      })
      .catch(err => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : '搜索失败');
      })
      .finally(() => {
        if (mounted) {
          setIsSearching(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [debouncedKeyword, searcher]);

  const clear = useCallback(() => {
    setKeyword('');
    setDebouncedKeyword('');
    setData(null);
    setError(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  return {
    keyword,
    data,
    isSearching,
    error,
    search,
    clear,
  };
}

/**
 * 乐观更新 Hook
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T) => Promise<{ success: boolean; error?: string }>
) {
  const [data, setData] = useState(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previousDataRef = useRef(initialData);

  const update = useCallback(async (newData: T) => {
    previousDataRef.current = data;
    setData(newData); // 乐观更新
    setIsUpdating(true);
    setError(null);

    try {
      const response = await updateFn(newData);

      if (!response.success) {
        // 回滚
        setData(previousDataRef.current);
        setError(response.error || '更新失败');
        return false;
      }

      return true;
    } catch (err) {
      // 回滚
      setData(previousDataRef.current);
      setError(err instanceof Error ? err.message : '更新失败');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [data, updateFn]);

  return {
    data,
    isUpdating,
    error,
    update,
  };
}

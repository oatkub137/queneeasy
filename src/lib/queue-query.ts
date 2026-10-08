import { queryOptions } from '@tanstack/react-query';
import { listQueue } from '@/lib/queue.functions';
export const queueQuery = queryOptions({ queryKey: ['shared-queue'], queryFn: () => listQueue(), staleTime: 0, refetchInterval: 30000 });
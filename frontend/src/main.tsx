import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import './styles/globals.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh: a short stale window plus refetch on window focus so
      // returning to a tab or remounting a page pulls current data. The old
      // 5-minute staleTime with refetchOnWindowFocus:false made lists and
      // dashboards show stale data for minutes after it had changed elsewhere.
      // Genuinely static data (e.g. problem content) can override staleTime
      // per-query.
      staleTime: 1000 * 30, // 30 seconds
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);

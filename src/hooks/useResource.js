import { useCallback, useEffect, useRef, useState } from 'react';

/** Keep asynchronous results scoped to the current route/user. No silent mock fallback. */
export function useResource(loader, dependencies = []) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const requestRef = useRef(0);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    const request = ++requestRef.current;
    setState({ data: null, loading: true, error: null });
    Promise.resolve()
      .then(() => loaderRef.current())
      .then((data) => {
        if (request === requestRef.current) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (request === requestRef.current)
          setState({
            data: null,
            loading: false,
            error: error.message || 'Could not load this page.',
          });
      });
    return () => {
      requestRef.current++;
    };
  }, [...dependencies, revision]);
  useEffect(() => {
    window.addEventListener('kotoba:data-changed', reload);
    return () => window.removeEventListener('kotoba:data-changed', reload);
  }, [reload]);
  return { ...state, reload };
}

import { Button, Skeleton } from './ui/index.jsx';
export default function ResourceState({ resource, children }) {
  if (resource.loading) return <Skeleton />;
  if (resource.error)
    return (
      <div className="page-stack">
        <div role="alert" className="notice notice-error">
          {resource.error}
        </div>
        <div>
          <Button onClick={resource.reload}>Try again</Button>
        </div>
      </div>
    );
  return typeof children === 'function' ? children(resource.data) : children;
}

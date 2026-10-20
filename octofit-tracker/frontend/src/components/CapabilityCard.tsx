import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  items?: Array<Record<string, unknown>>;
  renderItem?: (item: Record<string, unknown>, index: number) => ReactNode;
};

function stringifyValue(item: Record<string, unknown>) {
  const possibleEntries = ['title', 'name', 'teamName', 'type', 'focus', 'reason'] as const;
  for (const key of possibleEntries) {
    const value = item[key];
    if (value !== undefined && value !== null && value !== '') return String(value);
  }
  const firstValue = Object.values(item).find((value) => value !== undefined && value !== null && value !== '');
  return firstValue === undefined ? '' : String(firstValue);
}

export function CapabilityCard({ title, description, loading = false, error = null, emptyText, items = [], renderItem }: Props) {
  let content: ReactNode;

  if (loading) {
    content = <p role="status">Loading...</p>;
  } else if (error) {
    content = <div role="alert">{error}</div>;
  } else if (!items || items.length === 0) {
    content = <p>{emptyText ?? 'No results available.'}</p>;
  } else {
    content = (
      <ul className="list-unstyled mb-0">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{renderItem ? renderItem(item, index) : stringifyValue(item)}</li>
        ))}
      </ul>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {content}
      </div>
    </section>
  );
}

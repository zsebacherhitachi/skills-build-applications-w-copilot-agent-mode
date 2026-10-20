import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title?: string; focus?: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then((response) => {
        if (!active) return;
        setSuggestions(response.suggestions ?? []);
        setError(null);
      })
      .catch((fetchError: Error) => {
        if (!active) return;
        setError(`Unable to load workout suggestions: ${fetchError.message}`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      error={error}
      emptyText="No workout suggestions available."
      items={suggestions}
      renderItem={(suggestion) => `${suggestion.title ?? 'Workout'}${suggestion.reason ? ` — ${suggestion.reason}` : ''}`}
    />
  );
}

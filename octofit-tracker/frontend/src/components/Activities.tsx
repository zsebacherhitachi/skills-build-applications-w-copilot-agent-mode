import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = { type?: string; minutes?: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ activities: ActivityRecord[] }>('/api/activities')
      .then((response) => {
        if (!active) return;
        setActivities(response.activities ?? []);
        setError(null);
      })
      .catch((fetchError: Error) => {
        if (!active) return;
        setError(`Unable to load activities: ${fetchError.message}`);
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
      title="Activities"
      description="Track student activity minutes and points."
      loading={loading}
      error={error}
      emptyText="No activities recorded."
      items={activities}
      renderItem={(activity) => `${activity.type ?? 'Activity'} ${activity.minutes ?? ''} min${activity.points !== undefined ? ` • ${activity.points} pts` : ''}`.trim()}
    />
  );
}

import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName?: string; totalPoints?: number; rank?: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((response) => {
        if (!active) return;
        setEntries(response.leaderboard ?? []);
        setError(null);
      })
      .catch((fetchError: Error) => {
        if (!active) return;
        setError(`Unable to load leaderboard: ${fetchError.message}`);
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
      title="Leaderboard"
      description="Compare team point totals."
      loading={loading}
      error={error}
      emptyText="No leaderboard available."
      items={entries}
      renderItem={(entry) => `${entry.teamName ?? 'Team'}: ${entry.totalPoints ?? 0} pts (#${entry.rank ?? 0})`}
    />
  );
}

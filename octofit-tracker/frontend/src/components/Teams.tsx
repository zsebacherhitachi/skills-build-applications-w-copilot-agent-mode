import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = { name?: string; mascot?: string; members?: Array<string | { toString: () => string }> };

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ teams: TeamRecord[] }>('/api/teams')
      .then((response) => {
        if (!active) return;
        setTeams(response.teams ?? []);
        setError(null);
      })
      .catch((fetchError: Error) => {
        if (!active) return;
        setError(`Unable to load teams: ${fetchError.message}`);
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
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      error={error}
      emptyText="No teams available."
      items={teams}
      renderItem={(team) => `${team.name ?? 'Team'} (${(team.members ?? []).map((member) => String(member)).join(', ') || 'no members'})`}
    />
  );
}

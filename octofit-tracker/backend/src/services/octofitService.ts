import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string): never {
  const error = new Error(message) as Error & { status?: number };
  error.status = 400;
  throw error;
}

function notFound(message: string): never {
  const error = new Error(message) as Error & { status?: number };
  error.status = 404;
  throw error;
}

function ensureObject(payload: unknown, label: string): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    badRequest(`${label} must be an object`);
  }
  return payload as Record<string, unknown>;
}

function parseObjectId(value: unknown, label: string) {
  if (value === undefined || value === null || value === '') {
    badRequest(`${label} is required`);
  }
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    badRequest(`Invalid ${label}`);
  }
  return new mongoose.Types.ObjectId(value);
}

function toPositiveNumber(value: unknown, label: string): number {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    badRequest(`${label} must be a positive number`);
  }
  return numericValue;
}

function activityPointsFor(type: string, minutes: number) {
  return Math.max(1, Math.round(minutes));
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const payload = ensureObject(input, 'Activity payload');
  const userId = parseObjectId(payload.userId, 'userId');
  const teamId = parseObjectId(payload.teamId, 'teamId');
  const type = typeof payload.type === 'string' ? payload.type.trim() : '';
  const minutes = toPositiveNumber(payload.minutes, 'minutes');

  if (!type) badRequest('Activity type is required');

  const user = await User.findById(userId);
  if (!user) notFound('User not found');
  const team = await Team.findById(teamId);
  if (!team) notFound('Team not found');

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: activityPointsFor(type, minutes),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const payload = ensureObject(input, 'Team payload');
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const mascot = typeof payload.mascot === 'string' ? payload.mascot.trim() : '';

  if (!name) badRequest('Team name is required');
  if (!mascot) badRequest('Team mascot is required');

  const rawMembers = Array.isArray(payload.members) ? payload.members : [];
  const members = rawMembers.map((member, index) => {
    if (typeof member !== 'string' || !mongoose.isValidObjectId(member)) {
      badRequest(`Member ${index + 1} is not a valid user id`);
    }
    return new mongoose.Types.ObjectId(member);
  });

  const team = await Team.create({ name, mascot, members });
  return team.toObject();
}

export async function getLeaderboard() {
  const rows = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  const leaderboard: Array<{ teamName: string; totalPoints: number; rank: number }> = [];

  for (const [index, row] of rows.entries()) {
    const team = await Team.findById(row._id).lean();
    if (!team) continue;
    leaderboard.push({
      teamName: team.name,
      totalPoints: Number(row.totalPoints ?? 0),
      rank: index + 1,
    });
  }

  return leaderboard;
}

function buildWorkoutReason(workout: { focus?: string | null }, recentType: string | null, preferredFocus: string | null) {
  const focusText = workout.focus ?? preferredFocus ?? 'wellness';
  const recentText = recentType ? `recent ${recentType} activity` : 'recent activity';
  const goalText = preferredFocus ? ` and your ${preferredFocus} goal` : '';
  return `Based on your ${recentText}${goalText}, this ${focusText} workout is a strong fit.`;
}

export async function suggestWorkouts(userEmail: string) {
  const email = (userEmail ?? '').trim().toLowerCase();
  const user = await User.findOne({ email }).lean();
  if (!user) notFound('User not found');

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const preferredFocus = String(user.fitnessGoal ?? recentActivities[0]?.type ?? 'endurance').trim().toLowerCase();

  let workouts = await Workout.find({ focus: preferredFocus }).lean();
  if (workouts.length === 0) {
    workouts = await Workout.find().lean();
  }

  const recentType = recentActivities[0]?.type ? String(recentActivities[0].type).toLowerCase() : null;

  return workouts.map((workout) => ({
    ...workout,
    focus: workout.focus,
    reason: buildWorkoutReason(workout, recentType, preferredFocus),
  }));
}

export { User };

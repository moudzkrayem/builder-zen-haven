export interface User {
  id: string;
  name: string;
  email?: string;
  social?: { twitter?: string; instagram?: string; linkedin?: string };
}

export interface Rating {
  id: string;
  fromUserId: string;
  toUserId?: string; // if rating for a user
  eventId?: number; // if rating for an event
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}

const users: User[] = [
  { id: "u1", name: "Alice", email: "alice@example.com", social: { twitter: "@alice" } },
  { id: "u2", name: "Bob", email: "bob@example.com", social: { instagram: "@bobgram" } },
  { id: "u3", name: "Carlos", email: "carlos@example.com", social: { linkedin: "carlos-link" } },
  { id: "u4", name: "Dana", email: "dana@example.com" },
  { id: "u5", name: "Eve", email: "eve@example.com", social: { twitter: "@eve" } },
];

const ratings: Rating[] = [
  { id: "r1", fromUserId: "u1", toUserId: "u2", rating: 5, comment: "Great to meet", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() },
  { id: "r2", fromUserId: "u2", toUserId: "u1", rating: 4, comment: "Nice", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
  { id: "r3", fromUserId: "u3", eventId: 1, rating: 5, comment: "Loved the event", createdAt: new Date().toISOString() },
  { id: "r4", fromUserId: "u4", eventId: 2, rating: 3, comment: "Okay", createdAt: new Date().toISOString() },
  { id: "r5", fromUserId: "u5", toUserId: "u3", rating: 2, comment: "Not great", createdAt: new Date().toISOString() },
  { id: "r6", fromUserId: "u1", eventId: 3, rating: 4, comment: "Solid", createdAt: new Date().toISOString() },
];

export function getUsers() {
  return users.slice();
}

export function getRatings() {
  return ratings.slice();
}

export function getUserById(id: string) {
  return users.find((u) => u.id === id) || null;
}

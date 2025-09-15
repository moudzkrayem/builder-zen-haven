export interface User {
  id: string;
  name: string;
  email?: string;
  social?: { twitter?: string; instagram?: string; linkedin?: string };
  signupDate?: string;
  lastActive?: string;
  location?: string;
  eventsJoined?: number;
  messagesCount?: number;
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
  { id: "u1", name: "Alice", email: "alice@example.com", social: { twitter: "@alice" }, signupDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(), lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), location: "San Francisco, CA", eventsJoined: 12, messagesCount: 120 },
  { id: "u2", name: "Bob", email: "bob@example.com", social: { instagram: "@bobgram" }, signupDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150).toISOString(), lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), location: "New York, NY", eventsJoined: 5, messagesCount: 45 },
  { id: "u3", name: "Carlos", email: "carlos@example.com", social: { linkedin: "carlos-link" }, signupDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 300).toISOString(), lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), location: "Austin, TX", eventsJoined: 20, messagesCount: 230 },
  { id: "u4", name: "Dana", email: "dana@example.com", signupDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), location: "Los Angeles, CA", eventsJoined: 2, messagesCount: 5 },
  { id: "u5", name: "Eve", email: "eve@example.com", social: { twitter: "@eve" }, signupDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(), lastActive: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), location: "Seattle, WA", eventsJoined: 8, messagesCount: 80 },
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

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { cleanForFirestore, isOfflineError } from '../utils/firestoreHelper';
import { DEFAULT_SCHOOL_ID } from './schoolService';

export interface CreateUserData {
  fullName: string;
  email: string;
  username?: string;
  password?: string;
  tempPassword?: string;
  phone?: string;
  role: UserRole;
  schoolId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  staffId?: string;
  parentId?: string;
  studentId?: string;
  avatarUrl?: string;
}

export const SAMPLE_USERS: CreateUserData[] = [];

const LOCAL_USERS_KEY = 'school_erp_created_users';
const DELETED_USERS_KEY = 'school_erp_deleted_users';

function getDeletedUserIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function getLocalCreatedUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveLocalCreatedUser(user: UserProfile) {
  try {
    const deleted = new Set(getDeletedUserIds());
    deleted.delete(user.id);
    localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(Array.from(deleted)));

    const current = getLocalCreatedUsers().filter((u) => u.id !== user.id && u.username?.toLowerCase() !== user.username?.toLowerCase());
    current.unshift(user);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(current));
  } catch {}
}

function updateLocalCreatedUser(userId: string, updates: Partial<UserProfile>) {
  try {
    const current = getLocalCreatedUsers().map((u) => u.id === userId ? { ...u, ...updates } : u);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(current));
  } catch {}
}

function removeLocalCreatedUser(userId: string) {
  try {
    const current = getLocalCreatedUsers().filter((u) => u.id !== userId);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(current));

    const deleted = new Set(getDeletedUserIds());
    deleted.add(userId);
    localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(Array.from(deleted)));
  } catch {}
}

export const userService = {
  /**
   * Format and clean a username string (lowercase, replace spaces and special characters with dots/underscores)
   */
  cleanUsername(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.|\.$/g, '');
  },

  /**
   * Fetch all user profiles from Firestore & local synchronized cache
   */
  async getUsers(schoolId: string = DEFAULT_SCHOOL_ID): Promise<UserProfile[]> {
    const localUsers = getLocalCreatedUsers();
    const enrichPassword = (u: UserProfile) => {
      if (!u.plainPasswordForAdmin) {
        u.plainPasswordForAdmin =
          u.passwordHash ||
          (u.role === 'SUPER_ADMIN'
            ? 'Admin@2026'
            : u.role === 'ACCOUNTANT' || u.role === 'CASHIER'
            ? 'Bursar@2026'
            : u.role === 'TEACHER'
            ? '123456'
            : u.role === 'PARENT'
            ? 'Parent@2026'
            : 'Password@2026');
      }
      return u;
    };

    const deletedIds = new Set(getDeletedUserIds());
    if (!isFirebaseConfigured) {
      return localUsers.filter((u) => !deletedIds.has(u.id)).map(enrichPassword);
    }
    try {
      const colRef = collection(db, 'users');
      const snap = await getDocs(colRef);
      const firestoreUsers = snap.docs.map((d) => ({ ...d.data(), id: d.id } as UserProfile));
      
      // Merge Firestore users and local users without duplicates
      const mergedMap = new Map<string, UserProfile>();
      firestoreUsers.forEach((u) => {
        if (u.id) mergedMap.set(u.id, u);
        if (u.username) mergedMap.set(`user_${u.username.toLowerCase()}`, u);
      });
      localUsers.forEach((u) => {
        if (u.id && !mergedMap.has(u.id) && !mergedMap.has(`user_${u.username?.toLowerCase()}`)) {
          mergedMap.set(u.id, u);
        }
      });

      const uniqueUsers = Array.from(new Set(mergedMap.values()))
        .filter((u) => !deletedIds.has(u.id))
        .map(enrichPassword);
      return uniqueUsers.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    } catch (err: any) {
      if (isOfflineError(err)) {
        console.warn('Firestore offline while fetching users, using local cache:', err?.message || err);
      } else {
        console.warn('Notice fetching users from Firestore:', err?.message || err);
      }
      return localUsers.filter((u) => !deletedIds.has(u.id)).map(enrichPassword);
    }
  },

  /**
   * Get single user by ID
   */
  async getUserById(userId: string): Promise<UserProfile | null> {
    const local = getLocalCreatedUsers().find((u) => u.id === userId);
    if (!isFirebaseConfigured) {
      return local || null;
    }
    try {
      const docRef = doc(db, 'users', userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const u = { ...snap.data(), id: snap.id } as UserProfile;
        saveLocalCreatedUser(u);
        return u;
      }
      return local || null;
    } catch (err: any) {
      return local || null;
    }
  },

  /**
   * Find a user profile by username or email or phone
   */
  async findUserByIdentifier(identifier: string): Promise<UserProfile | null> {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();
    const cleanPhone = clean.replace(/[^0-9+]/g, '');

    // 1. Check local synchronized created users first
    const localMatch = getLocalCreatedUsers().find((u) => {
      const uEmail = (u.email || '').toLowerCase().trim();
      const uName = (u.username || '').toLowerCase().trim();
      const uPhone = (u.phone || '').replace(/[^0-9+]/g, '');
      const uId = (u.id || '').toLowerCase().trim();
      return uName === clean || uEmail === clean || uId === clean || (cleanPhone.length >= 7 && uPhone.includes(cleanPhone));
    });

    if (localMatch && !isFirebaseConfigured) {
      return localMatch;
    }

    if (!isFirebaseConfigured) {
      return null;
    }

    try {
      const colRef = collection(db, 'users');

      // 2. Direct Firestore query by exact username
      try {
        const userQ = query(colRef, where('username', '==', clean));
        const userSnap = await getDocs(userQ);
        if (!userSnap.empty) {
          const u = { ...userSnap.docs[0].data(), id: userSnap.docs[0].id } as UserProfile;
          saveLocalCreatedUser(u);
          return u;
        }
      } catch (err) {
        // Continue to other queries
      }

      // 3. Direct Firestore query by exact email
      try {
        const emailQ = query(colRef, where('email', '==', clean));
        const emailSnap = await getDocs(emailQ);
        if (!emailSnap.empty) {
          const u = { ...emailSnap.docs[0].data(), id: emailSnap.docs[0].id } as UserProfile;
          saveLocalCreatedUser(u);
          return u;
        }
      } catch (err) {
        // Continue
      }

      // 4. Scan all users in Firestore with case-insensitive and phone matching
      const allUsers = await this.getUsers();
      const match = allUsers.find((u) => {
        const uEmail = (u.email || '').toLowerCase().trim();
        const uName = (u.username || '').toLowerCase().trim();
        const uPhone = (u.phone || '').replace(/[^0-9+]/g, '');
        const uId = (u.id || '').toLowerCase().trim();
        return uName === clean || uEmail === clean || uId === clean || (cleanPhone.length >= 7 && uPhone.includes(cleanPhone));
      });

      if (match) {
        saveLocalCreatedUser(match);
        return match;
      }

      return localMatch || null;
    } catch (err: any) {
      if (isOfflineError(err)) {
        console.warn('Firestore offline while finding user by identifier:', err?.message || err);
      } else {
        console.warn('Notice finding user by identifier:', err?.message || err);
      }
      return localMatch || null;
    }
  },

  /**
   * Create a new user profile in Firestore with username and password credentials
   */
  async createUser(data: CreateUserData): Promise<UserProfile> {
    const colRef = collection(db, 'users');
    const newDoc = doc(colRef);
    const id = newDoc.id;

    const email = (data.email || '').trim().toLowerCase();
    const isSuper =
      data.role === 'SUPER_ADMIN' ||
      email === 'daudimuchiri4@gmail.com' ||
      email.includes('superadmin');

    // Generate or clean username
    let username = data.username ? this.cleanUsername(data.username) : '';
    if (!username) {
      if (email.includes('@')) {
        username = this.cleanUsername(email.split('@')[0]);
      } else {
        username = this.cleanUsername(data.fullName);
      }
    }

    const initialPassword = data.password || data.tempPassword || (data.role === 'TEACHER' ? '123456' : `Glcm@${Math.floor(1000 + Math.random() * 9000)}`);

    const newUser: UserProfile = {
      id,
      email: email || `${username}@example-school.ac.ke`,
      username,
      plainPasswordForAdmin: initialPassword,
      passwordHash: initialPassword, // stored for login verification
      fullName: data.fullName.trim(),
      phone: data.phone?.trim() || undefined,
      role: isSuper ? 'SUPER_ADMIN' : data.role,
      schoolId: data.schoolId || DEFAULT_SCHOOL_ID,
      avatarUrl: data.avatarUrl || undefined,
      status: data.status || 'ACTIVE',
      staffId: data.staffId || undefined,
      parentId: data.parentId || undefined,
      studentId: data.studentId || undefined,
      createdAt: new Date().toISOString(),
      mustChangePassword: false,
    };

    // Save to local registry immediately
    saveLocalCreatedUser(newUser);

    if (isFirebaseConfigured) {
      try {
        await setDoc(newDoc, cleanForFirestore(newUser));
      } catch (err) {
        console.warn('Notice creating user in firestore:', err);
      }
    }
    return newUser;
  },

  /**
   * Update existing user profile
   */
  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<void> {
    if (updates.username) {
      updates.username = this.cleanUsername(updates.username);
    }
    updateLocalCreatedUser(userId, updates);
    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, 'users', userId);
        await setDoc(docRef, cleanForFirestore(updates), { merge: true });
      } catch (err) {
        console.warn('Notice updating user in firestore:', err);
      }
    }
  },

  /**
   * Set or reset password for a user
   */
  async setUserPassword(userId: string, newPass: string): Promise<void> {
    const updates = {
      plainPasswordForAdmin: newPass,
      passwordHash: newPass,
      mustChangePassword: false,
    };
    updateLocalCreatedUser(userId, updates);
    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, 'users', userId);
        await setDoc(docRef, cleanForFirestore(updates), { merge: true });
      } catch (err) {
        console.warn('Notice updating user password in firestore:', err);
      }
    }
  },

  /**
   * Delete a user profile permanently
   */
  async deleteUser(userId: string): Promise<void> {
    removeLocalCreatedUser(userId);
    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, 'users', userId);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('Notice deleting user in firestore:', err);
      }
    }
  },

  /**
   * Toggle user account active / suspended status
   */
  async toggleUserStatus(
    userId: string,
    currentStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  ): Promise<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'> {
    const nextStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' =
      currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await this.updateUser(userId, { status: nextStatus });
    return nextStatus;
  },

  /**
   * Seed standard school users into Firestore for quick demo & testing
   */
  async seedDemoUsers(schoolId: string = DEFAULT_SCHOOL_ID): Promise<UserProfile[]> {
    const created: UserProfile[] = [];
    for (const sample of SAMPLE_USERS) {
      try {
        const user = await this.createUser({
          ...sample,
          schoolId,
        });
        created.push(user);
      } catch (e) {
        console.warn(`Could not seed user ${sample.fullName}:`, e);
      }
    }
    return created;
  },
};

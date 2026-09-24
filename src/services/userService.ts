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
   * Fetch all user profiles from Firestore
   */
  async getUsers(schoolId: string = DEFAULT_SCHOOL_ID): Promise<UserProfile[]> {
    if (!isFirebaseConfigured) {
      return [];
    }
    try {
      const colRef = collection(db, 'users');
      const snap = await getDocs(colRef);
      if (snap.empty) {
        return [];
      }
      const users = snap.docs.map((d) => ({ ...d.data(), id: d.id } as UserProfile));
      
      // Return sorted by creation date or full name
      return users.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    } catch (err: any) {
      if (isOfflineError(err)) {
        console.warn('Firestore offline while fetching users:', err?.message || err);
      } else {
        console.warn('Notice fetching users from Firestore:', err?.message || err);
      }
      return [];
    }
  },

  /**
   * Get single user by ID
   */
  async getUserById(userId: string): Promise<UserProfile | null> {
    if (!isFirebaseConfigured) {
      return null;
    }
    try {
      const docRef = doc(db, 'users', userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as UserProfile;
      }
      return null;
    } catch (err: any) {
      if (isOfflineError(err)) {
        console.warn(`Firestore offline while fetching user ${userId}:`, err?.message || err);
      } else {
        console.warn(`Notice fetching user ${userId}:`, err?.message || err);
      }
      return null;
    }
  },

  /**
   * Find a user profile by username or email or phone
   */
  async findUserByIdentifier(identifier: string): Promise<UserProfile | null> {
    if (!isFirebaseConfigured) {
      return null;
    }
    try {
      const clean = identifier.trim().toLowerCase();
      const users = await this.getUsers();
      const match = users.find((u) => {
        const uEmail = (u.email || '').toLowerCase().trim();
        const uName = (u.username || '').toLowerCase().trim();
        const uPhone = (u.phone || '').replace(/[^0-9+]/g, '');
        const cleanPhone = clean.replace(/[^0-9+]/g, '');
        return uEmail === clean || uName === clean || (cleanPhone.length >= 7 && uPhone.includes(cleanPhone));
      });
      return match || null;
    } catch (err: any) {
      if (isOfflineError(err)) {
        console.warn('Firestore offline while finding user by identifier:', err?.message || err);
      } else {
        console.warn('Notice finding user by identifier:', err?.message || err);
      }
      return null;
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
    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, cleanForFirestore(updates));
      } catch (err) {
        console.warn('Notice updating user in firestore:', err);
      }
    }
  },

  /**
   * Set or reset password for a user
   */
  async setUserPassword(userId: string, newPass: string): Promise<void> {
    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, cleanForFirestore({
          plainPasswordForAdmin: newPass,
          passwordHash: newPass,
          mustChangePassword: false,
        }));
      } catch (err) {
        console.warn('Notice updating user password in firestore:', err);
      }
    }
  },

  /**
   * Delete a user profile
   */
  async deleteUser(userId: string): Promise<void> {
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

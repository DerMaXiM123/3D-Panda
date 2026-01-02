
import { User, Filament, Post, Friend, PrivateMessage, GitHubConfig, MaintenanceTask, Project, Printer, PrintLogEntry, ResinProfile, Broadcast, WebRTCSignal } from '../types';

class DatabaseService {
  private dbName = 'PrintVerseDB';
  private version = 6; 

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('user')) db.createObjectStore('user');
        
        const inlineStores = ['filaments', 'posts', 'friends', 'messages', 'broadcasts', 'signaling', 'maintenance', 'projects', 'printers', 'printLogs', 'resinProfiles'];
        inlineStores.forEach(s => {
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' });
        });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllValues<T>(storeName: string): Promise<T[]> {
    const db = await this.getDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  private async setValue<T>(storeName: string, key: string | null, value: T): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    if (store.keyPath === null) {
      store.put(value, key || undefined);
    } else {
      store.put(value);
    }
  }

  private async deleteValue(storeName: string, key: string): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).delete(key);
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction('user', 'readonly');
      return new Promise((resolve) => {
        const request = transaction.objectStore('user').get('current');
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    } catch(e) { return null; }
  }

  async updateUser(userData: Partial<User>): Promise<User> {
    const current = await this.getCurrentUser();
    const updated = { ...(current || {}), ...userData } as User;
    await this.setValue('user', 'current', updated);
    return updated;
  }

  async login(user: User) { await this.setValue('user', 'current', user); }
  async logout() { await this.deleteValue('user', 'current'); }

  async getFilaments(): Promise<Filament[]> { return this.getAllValues<Filament>('filaments'); }
  async updateFilament(f: Filament) { await this.setValue('filaments', null, f); }
  async deleteFilament(id: string) { await this.deleteValue('filaments', id); }

  async getPrinters(): Promise<Printer[]> { return this.getAllValues<Printer>('printers'); }
  async updatePrinter(p: Printer) { await this.setValue('printers', null, p); }
  async deletePrinter(id: string) { await this.deleteValue('printers', id); }

  async getPrintLogs(): Promise<PrintLogEntry[]> { return this.getAllValues<PrintLogEntry>('printLogs'); }
  async addPrintLog(log: PrintLogEntry) { await this.setValue('printLogs', null, log); }
  async deletePrintLog(id: string) { await this.deleteValue('printLogs', id); }

  async getResinProfiles(): Promise<ResinProfile[]> { return this.getAllValues<ResinProfile>('resinProfiles'); }
  async updateResinProfile(rp: ResinProfile) { await this.setValue('resinProfiles', null, rp); }
  async deleteResinProfile(id: string) { await this.deleteValue('resinProfiles', id); }

  async getProjects(): Promise<Project[]> { return this.getAllValues<Project>('projects'); }
  async updateProject(p: Project) { await this.setValue('projects', null, p); }
  async deleteProject(id: string) { await this.deleteValue('projects', id); }

  async getPosts(): Promise<Post[]> { return this.getAllValues<Post>('posts'); }
  async createPost(post: any) {
    const newPost = { ...post, id: Date.now().toString(), likes: 0, comments: 0, timestamp: 'Gerade eben' };
    await this.setValue('posts', null, newPost);
    return newPost;
  }

  async getFriends(): Promise<Friend[]> { return this.getAllValues<Friend>('friends'); }
  async addFriend(name: string): Promise<Friend> {
    const f: Friend = { id: `f_${Date.now()}`, username: name, email: '', avatar: `https://i.pravatar.cc/150?u=${name}`, isPro: false, joinedDate: 'Heute', isFollowing: true, status: 'online' };
    await this.setValue('friends', null, f);
    return f;
  }

  async getPrivateMessages(u1: string, u2: string): Promise<PrivateMessage[]> {
    const all = await this.getAllValues<PrivateMessage>('messages');
    return all.filter(m => (m.fromId === u1 && m.toId === u2) || (m.fromId === u2 && m.toId === u1));
  }
  async sendPrivateMessage(m: any) {
    const msg = { ...m, id: `m_${Date.now()}`, timestamp: new Date().toISOString() };
    await this.setValue('messages', null, msg);
    return msg;
  }

  async getMaintenanceTasks(): Promise<MaintenanceTask[]> { return this.getAllValues('maintenance'); }
  async addMaintenanceTask(t: any) {
    const task = { ...t, id: `mt_${Date.now()}` };
    await this.setValue('maintenance', null, task);
    return task;
  }
  async deleteMaintenanceTask(id: string) { await this.deleteValue('maintenance', id); }

  async getActiveBroadcasts(): Promise<Broadcast[]> {
    return this.getAllValues<Broadcast>('broadcasts');
  }

  async startBroadcast(bc: Broadcast): Promise<void> {
    await this.setValue('broadcasts', bc.id, bc);
  }

  async stopBroadcast(id: string): Promise<void> {
    await this.deleteValue('broadcasts', id);
  }

  async getSignalsFor(userId: string): Promise<WebRTCSignal[]> {
    const db = await this.getDB();
    const transaction = db.transaction('signaling', 'readwrite');
    const store = transaction.objectStore('signaling');
    
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = async () => {
        const all = request.result as WebRTCSignal[];
        const signals = all.filter(s => s.to === userId);
        for (const sig of signals) {
          store.delete(sig.id);
        }
        resolve(signals);
      };
    });
  }

  async sendSignal(sig: WebRTCSignal): Promise<void> {
    await this.setValue('signaling', sig.id, sig);
  }

  async exportBackup(): Promise<string> {
    const data: any = {};
    const stores = ['filaments', 'printers', 'printLogs', 'projects', 'resinProfiles', 'maintenance'];
    for (const s of stores) {
      data[s] = await this.getAllValues(s);
    }
    return JSON.stringify(data, null, 2);
  }

  async importBackup(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    for (const [storeName, values] of Object.entries(data)) {
      if (Array.isArray(values)) {
        for (const val of values) {
          await this.setValue(storeName, null, val);
        }
      }
    }
  }

  async compressImage(s: string, w: number, q: number) { return s; } 
  async syncFromGitHub(c: any) {}
  async syncToGitHub(c: any) {}
}

export const db = new DatabaseService();

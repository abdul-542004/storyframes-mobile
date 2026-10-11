// Firebase mock for Jest environment
module.exports = {
  initializeApp: jest.fn(),
  getApps: jest.fn().mockReturnValue([]),
  getApp: jest.fn(),

  getAuth: jest.fn().mockReturnValue({ currentUser: null }),
  initializeAuth: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),

  getFirestore: jest.fn().mockReturnValue({}),
  collection: jest.fn((db, col) => ({ col })),
  doc: jest.fn((db, col, id) => ({ id, path: `${col}/${id}` })),
  setDoc: jest.fn().mockResolvedValue(undefined),
  getDoc: jest.fn().mockResolvedValue({ exists: () => false, data: () => null }),
  getDocs: jest.fn().mockResolvedValue({ empty: true, forEach: () => {} }),
  query: jest.fn(),
  orderBy: jest.fn(),
  where: jest.fn(),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  serverTimestamp: jest.fn(),

  getStorage: jest.fn().mockReturnValue({ app: {} }),
  ref: jest.fn((storage, path) => ({ path })),
  uploadString: jest.fn().mockResolvedValue({ ref: { fullPath: 'mock/path' } }),
  getDownloadURL: jest.fn().mockResolvedValue('https://firebasestorage.googleapis.com/mock/image.png'),
};

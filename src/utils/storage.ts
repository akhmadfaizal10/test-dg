// Storage utilities for managing user data
export interface UserData {
  userId: string;
  letterheads: any[];
  savedDocuments: any[];
  projects: Project[];
}

export interface Project {
  id: string;
  name: string;
  letterheadId?: string;
  documentData: any;
  createdAt: string;
  updatedAt: string;
}

// Generate or get user ID
export const getUserId = (): string => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
};

// Get user data
export const getUserData = (): UserData => {
  const userId = getUserId();
  const userData = localStorage.getItem(`userData_${userId}`);
  
  if (userData) {
    return JSON.parse(userData);
  }
  
  return {
    userId,
    letterheads: [],
    savedDocuments: [],
    projects: []
  };
};

// Save user data
export const saveUserData = (data: UserData): void => {
  const userId = getUserId();
  localStorage.setItem(`userData_${userId}`, JSON.stringify(data));
};

// Convert file to base64 for storage
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Convert base64 to blob URL
export const base64ToBlob = (base64: string): string => {
  try {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray]);
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    return base64;
  }
};
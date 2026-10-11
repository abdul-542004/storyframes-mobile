import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocalDraft, StoryPanel } from '../lib/types';
import { getAllDrafts, saveDraft, deleteDraft as deleteDraftDb, getDraftById } from '../lib/sqlite';

interface DraftsContextType {
  drafts: LocalDraft[];
  loading: boolean;
  refreshDrafts: () => Promise<void>;
  createDraft: (title: string, teaser: string, accentColor: string) => Promise<LocalDraft>;
  updateDraft: (draft: LocalDraft) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  getDraft: (id: string) => Promise<LocalDraft | null>;
}

const DraftsContext = createContext<DraftsContextType>({
  drafts: [],
  loading: false,
  refreshDrafts: async () => {},
  createDraft: async () => ({ id: '', title: '', teaser: '', accentColor: '', createdAt: '', updatedAt: '', panels: [] }),
  updateDraft: async () => {},
  deleteDraft: async () => {},
  getDraft: async () => null,
});

export const DraftsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [drafts, setDrafts] = useState<LocalDraft[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshDrafts = async () => {
    try {
      const list = await getAllDrafts();
      setDrafts(list);
    } catch (err) {
      console.warn('Error fetching drafts from sqlite:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDrafts();
  }, []);

  const createDraft = async (title: string, teaser: string, accentColor: string): Promise<LocalDraft> => {
    const id = `draft_${Date.now()}`;
    const now = new Date().toISOString();
    const newDraft: LocalDraft = {
      id,
      title: title || 'Untitled Story',
      teaser: teaser || '',
      accentColor: accentColor || '#7A9E87',
      createdAt: now,
      updatedAt: now,
      panels: [
        {
          id: `panel_${Date.now()}_0`,
          sketchId: '__user__',
          caption: 'My story begins here...',
        },
      ],
    };

    await saveDraft(newDraft);
    await refreshDrafts();
    return newDraft;
  };

  const updateDraft = async (draft: LocalDraft) => {
    const updated = {
      ...draft,
      updatedAt: new Date().toISOString(),
    };
    await saveDraft(updated);
    await refreshDrafts();
  };

  const deleteDraft = async (id: string) => {
    await deleteDraftDb(id);
    await refreshDrafts();
  };

  const getDraft = async (id: string) => {
    return await getDraftById(id);
  };

  return (
    <DraftsContext.Provider
      value={{
        drafts,
        loading,
        refreshDrafts,
        createDraft,
        updateDraft,
        deleteDraft,
        getDraft,
      }}
    >
      {children}
    </DraftsContext.Provider>
  );
};

export const useDrafts = () => useContext(DraftsContext);

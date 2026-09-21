import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Plan } from '../../data/models';

interface PlanEditorState {
  /** The plan being built or edited. */
  draft: Plan | null;
  /** Snapshot when editing started, for change detection. Null when creating. */
  original: Plan | null;
  begin: (plan: Plan, original: Plan | null) => void;
  update: (fn: (plan: Plan) => Plan) => void;
  clear: () => void;
}

const Ctx = createContext<PlanEditorState>({ draft: null, original: null, begin: () => {}, update: () => {}, clear: () => {} });

/** Holds the in-progress plan across the creator's screens. */
export const PlanEditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [draft, setDraft] = useState<Plan | null>(null);
  const [original, setOriginal] = useState<Plan | null>(null);
  const begin = useCallback((plan: Plan, orig: Plan | null) => {
    setDraft(plan);
    setOriginal(orig);
  }, []);
  const update = useCallback((fn: (plan: Plan) => Plan) => setDraft(p => (p ? { ...fn(p), updatedAt: Date.now() } : p)), []);
  const clear = useCallback(() => {
    setDraft(null);
    setOriginal(null);
  }, []);
  const value = useMemo(() => ({ draft, original, begin, update, clear }), [draft, original, begin, update, clear]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const usePlanEditor = () => useContext(Ctx);

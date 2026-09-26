import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Plan } from '../../data/models';
import { useAuth } from '../../data/auth/AuthProvider';
import { planRepository } from '../../data/repositories/planRepository';
import { pruneSchedule } from '../../data/services/planService';

interface PlanEditorState {
  /** The plan being built or edited. */
  draft: Plan | null;
  /** Snapshot when editing started, for change detection. Null when creating. */
  original: Plan | null;
  begin: (plan: Plan, original: Plan | null) => void;
  update: (fn: (plan: Plan) => Plan) => void;
  /** Stop background saves; call before an explicit save or activation so a stale autosave can't land after it. */
  stopAutosave: () => void;
  clear: () => void;
}

const Ctx = createContext<PlanEditorState>({ draft: null, original: null, begin: () => {}, update: () => {}, stopAutosave: () => {}, clear: () => {} });

const AUTOSAVE_DELAY_MS = 800;

/**
 * Holds the in-progress plan across the creator's screens.
 *
 * A plan being created is saved to the account in the background as soon
 * as it has a name, so closing the app halfway leaves an unfinished draft
 * the Workout tab and My plans offer to finish. Edits to an existing plan
 * are not autosaved: those wait for Save so Cancel still means cancel.
 */
export const PlanEditorProvider = ({ children }: { children: React.ReactNode }) => {
  const { uid } = useAuth();
  const [draft, setDraft] = useState<Plan | null>(null);
  const [original, setOriginal] = useState<Plan | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveOn = useRef(false);
  const savedIds = useRef(new Set<string>());

  const cancelTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const begin = useCallback((plan: Plan, orig: Plan | null) => {
    cancelTimer();
    setDraft(plan);
    setOriginal(orig);
    autosaveOn.current = orig === null;
  }, []);
  const update = useCallback((fn: (plan: Plan) => Plan) => setDraft(p => (p ? { ...fn(p), updatedAt: Date.now() } : p)), []);
  const stopAutosave = useCallback(() => {
    autosaveOn.current = false;
    cancelTimer();
  }, []);
  const clear = useCallback(() => {
    stopAutosave();
    setDraft(null);
    setOriginal(null);
  }, [stopAutosave]);

  useEffect(() => {
    if (!uid || !draft || !autosaveOn.current || !draft.name.trim()) return;
    cancelTimer();
    const snapshot = draft;
    timer.current = setTimeout(() => {
      timer.current = null;
      if (!autosaveOn.current) return;
      const exists = savedIds.current.has(snapshot.id);
      planRepository
        .autosave(uid, pruneSchedule(snapshot), exists)
        .then(() => savedIds.current.add(snapshot.id))
        .catch(err => console.warn('plan autosave failed', err));
    }, AUTOSAVE_DELAY_MS);
    return cancelTimer;
  }, [uid, draft]);

  useEffect(() => cancelTimer, []);

  const value = useMemo(() => ({ draft, original, begin, update, stopAutosave, clear }), [draft, original, begin, update, stopAutosave, clear]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const usePlanEditor = () => useContext(Ctx);

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SavablePropertyInput, SavedProperty } from "@/lib/types";
import { resolveSavedRepository, type SavedRepository } from "@/lib/savedRepository";

interface SavedContextValue {
  items: SavedProperty[];
  count: number;
  isSaved: (id: string) => boolean;
  toggle: (input: SavablePropertyInput) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** True once storage has hydrated. */
  hydrated: boolean;
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({
  children,
  // Defaults to the env-selected adapter (NEXT_PUBLIC_SAVED_PROVIDER).
  // Pass an explicit repository to override (e.g. in tests).
  repository = resolveSavedRepository(),
}: {
  children: React.ReactNode;
  repository?: SavedRepository;
}) {
  const [items, setItems] = useState<SavedProperty[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Mirror `items` in a ref so callbacks read the latest without re-binding.
  const itemsRef = useRef<SavedProperty[]>(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Hydrate once from the repository.
  useEffect(() => {
    let active = true;
    repository
      .load()
      .then((loaded) => {
        if (active) setItems(loaded);
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, [repository]);

  const isSaved = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  );

  // Each mutation updates the UI optimistically, then reconciles with the
  // authoritative list the repository returns. On failure we keep the
  // optimistic state (localStorage stays the resilient fallback).
  const toggle = useCallback(
    (input: SavablePropertyInput) => {
      const exists = itemsRef.current.some((i) => i.id === input.id);
      if (exists) {
        setItems((prev) => prev.filter((i) => i.id !== input.id));
        repository.remove(input.id).then(setItems).catch(() => {});
      } else {
        const item: SavedProperty = { ...input, savedAt: Date.now() };
        setItems((prev) => [item, ...prev]);
        repository.add(item).then(setItems).catch(() => {});
      }
    },
    [repository]
  );

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      repository.remove(id).then(setItems).catch(() => {});
    },
    [repository]
  );

  const clear = useCallback(() => {
    setItems([]);
    repository.clear().then(setItems).catch(() => {});
  }, [repository]);

  const value = useMemo<SavedContextValue>(
    () => ({
      items,
      count: items.length,
      isSaved,
      toggle,
      remove,
      clear,
      hydrated,
      isOpen,
      openDrawer: () => setIsOpen(true),
      closeDrawer: () => setIsOpen(false),
    }),
    [items, isSaved, toggle, remove, clear, hydrated, isOpen]
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used within <SavedProvider>");
  return ctx;
}

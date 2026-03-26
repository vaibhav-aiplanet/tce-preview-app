import { atom, createStore, useAtomValue, useSetAtom } from "jotai";

type StringOrNull = string | null;

const current_grade = atom<StringOrNull>(null);
current_grade.debugLabel = "current_grade";

const current_subject = atom<StringOrNull>(null);
current_subject.debugLabel = "current_subject";

const current_subtopic = atom<StringOrNull>(null);
current_subtopic.debugLabel = "current_subtopic";

export const store = createStore();

export const useCurrentGrade = () => {
  const value = useAtomValue(current_grade, { store });
  return value !== null ? `Grade ${value}` : null;
};

export const useCurrentSubject = () => {
  return useAtomValue(current_subject, { store });
};

export const useCurrentSubtopic = () => {
  return useAtomValue(current_subtopic, { store });
};

export const useSetCurrentGrade = () => {
  return useSetAtom(current_grade, { store });
};

export const useSetCurrentSubject = () => {
  return useSetAtom(current_subject, { store });
};

export const useSetCurrentSubtopic = () => {
  return useSetAtom(current_subtopic, { store });
};

export const getStore = () => store;

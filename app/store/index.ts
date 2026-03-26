import {atom, useAtomValue, useSetAtom} from "jotai"

type StringOrNull = string | null

const current_grade = atom<StringOrNull>(null)
const current_subject = atom<StringOrNull>(null)
const current_subtopic= atom<StringOrNull>(null)

export const useCurrentGrade = () => {
  return useAtomValue(current_grade)
}

export const useCurrentSubject= () => {
  return useAtomValue(current_subject)
}

export const useCurrentSubtopic= () => {
  return useAtomValue(current_subtopic)
}

export const useSetCurrentGrade = () => {
  return useSetAtom(current_grade)
}

export const useSetCurrentSubject = () => {
  return useSetAtom(current_subject)
}

export const useSetCurrentSubtopic = () => {
  return useSetAtom(current_subtopic)
}


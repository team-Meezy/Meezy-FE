import { create } from 'zustand';

interface SignupState {
  // 상태 (State)
  step: number;
  email: string;
  authCode: string;
  id: string;
  name: string;
  password: string;
  passwordConfirm: string;
  remainingTime: number;

  // 액션 (Actions)
  setStep: (step: number) => void;
  setField: (
    field: keyof Omit<
      SignupState,
      'remainingTime' | 'step' | `set${string}` | 'reset'
    >,
    value: string
  ) => void;
  setRemainingTime: (time: number | ((prev: number) => number)) => void;
  reset: () => void;
  setEmail: (email: string) => void;
  setAuthCode: (authCode: string) => void;
  setId: (id: string) => void;
  setName: (name: string) => void;
  setPassword: (password: string) => void;
  setPasswordConfirm: (passwordConfirm: string) => void;
}

export const useSignupStore = create<SignupState>((set) => ({
  step: 1,
  email: '',
  authCode: '',
  id: '',
  name: '',
  password: '',
  passwordConfirm: '',
  remainingTime: 180,

  setStep: (step) => set({ step }),

  // 개별 필드를 업데이트하는 범용 액션
  setField: (field, value) => set((state) => ({ ...state, [field]: value })),

  setRemainingTime: (time) =>
    set((state) => ({
      remainingTime:
        typeof time === 'function' ? time(state.remainingTime) : time,
    })),
  setEmail: (email) => set({ email }),
  setAuthCode: (authCode) => set({ authCode }),
  setId: (id) => set({ id }),
  setName: (name) => set({ name }),
  setPassword: (password) => set({ password }),
  setPasswordConfirm: (passwordConfirm) => set({ passwordConfirm }),

  reset: () =>
    set({
      step: 1,
      email: '',
      authCode: '',
      id: '',
      name: '',
      password: '',
      passwordConfirm: '',
      remainingTime: 180,
    }),
}));

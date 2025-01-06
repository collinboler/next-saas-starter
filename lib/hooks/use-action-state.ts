'use client';

import { useState } from 'react';
import { ActionState } from '@/lib/auth/middleware';

export function useActionState<T extends ActionState, U>(
  action: (data: U, formData: FormData) => Promise<T | void>,
  initialState: T
): [T, (data: U) => Promise<void>, boolean] {
  const [state, setState] = useState<T>(initialState);
  const [pending, setPending] = useState(false);

  async function formAction(data: U) {
    setPending(true);
    try {
      const formData = new FormData();
      const form = document.querySelector('form');
      if (form) {
        const hiddenInputs = form.querySelectorAll<HTMLInputElement>('input[type="hidden"]');
        hiddenInputs.forEach((input) => {
          formData.append(input.name, input.value);
        });
      }
      const result = await action(data, formData);
      if (result) {
        setState(result as T);
      }
    } finally {
      setPending(false);
    }
  }

  return [state, formAction, pending];
} 
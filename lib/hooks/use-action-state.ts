'use client';

import { useState } from 'react';

export function useActionState<T, U>(
  action: (data: U) => Promise<T>,
  initialState: T
): [T, (data: U) => Promise<void>, boolean] {
  const [state, setState] = useState<T>(initialState);
  const [pending, setPending] = useState(false);

  async function formAction(data: U) {
    setPending(true);
    try {
      const result = await action(data);
      setState(result);
    } finally {
      setPending(false);
    }
  }

  return [state, formAction, pending];
} 
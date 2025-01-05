'use client';

import { useState, useTransition } from 'react';

export function useActionState<State, Payload>(
  action: (payload: Payload) => Promise<State>,
  initialState: State
) {
  const [state, setState] = useState<State>(initialState);
  const [isPending, startTransition] = useTransition();

  const formAction = async (payload: Payload) => {
    startTransition(async () => {
      const result = await action(payload);
      setState(result);
    });
  };

  return [state, formAction, isPending] as const;
} 
import React, { useState } from 'react';

export const Hello = () => {
  const [counter, setCounter] = useState(0);

  const increment = () => {
    setCounter(counter + 1);
  };

  return (
    <div class="flex items-center flex-wrap gap-4 justify-between py-4 rounded-lg bg-gray-900 px-8">
      <button onClick={increment} class="col-span-2 text-sm font-bold">Click me</button>
      <p class="text-slate-400 col-span-2">You've pressed the button {counter} times.</p>
    </div>
  );
};

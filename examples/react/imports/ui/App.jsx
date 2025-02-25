import React from 'react';
import { Hello } from './components/Hello.jsx';
import { Info } from './components/Info.jsx';
import '../../client/main.css';

export const App = () => (
  <div>
      <div id="meteor-vite-splash-screen" class="fixed inset-0 bg-gray-900">
          <div class="h-screen bg-gradient-to-br from-gray-900 via-indigo-700/50 via-15% to-green-900/5 to-80%">
              <div class="flex h-full flex-col items-center justify-center text-slate-300">
                  <div class="mx-1 w-full max-w-xl items-center justify-between space-y-6 rounded-lg bg-slate-800 p-8 shadow-xl">
                      <div class="grid gap-2">
                          <div class="text-2xl font-bold tracking-tight text-slate-200">Welcome to Meteor</div>
                          <p class="text-slate-400">
                              This is a placeholder template to get you started with Meteor-Vite
                          </p>
                      </div>

                      <Hello/>
                      <Info/>
                  </div>
              </div>
          </div>
      </div>
  </div>
);

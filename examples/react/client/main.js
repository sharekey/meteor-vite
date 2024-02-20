/**
 * These modules are automatically imported by jorgenvatle:vite-bundler.
 * You can commit these to your project or move them elsewhere if you'd like,
 * but they must be imported somewhere in your Meteor entrypoint file.
 *
 * More info: https://github.com/JorgenVatle/meteor-vite#lazy-loaded-meteor-packages
**/
import 'meteor/react-meteor-data';
/** End of vite-bundler auto-imports **/
//////////////////////////////////////////////////////////////////////////////////////////////////
// The following imports need to be included in your Meteor client's main module to             //
// prevent Meteor from omitting these from your client bundle.                                  //
//                                                                                              //
// This is necessary to ensure Vite can analyze exports from packages bundled by Meteor.        //
//                                                                                              //
// If you do not depend on meteor/react-meteor-data, it's safe to drop these and let Vite       //
// bundle React instead. This should lead to considerably faster build times.                   //
//////////////////////////////////////////////////////////////////////////////////////////////////
import 'react';
import 'react-dom';
import 'react-dom/client';
import 'react/jsx-dev-runtime';
import 'react-refresh';

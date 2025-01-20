# Meteor react-packages (npm)
> This is a npm-published fork of the official Meteor [`react-packages`](https://github.com/meteor/react-packages) repository.
> This allows us leave bundling of React up to Vite, instead of relying on Meteor's bundling system. Giving a little 
> bit more flexibility in terms of configuration through Vite.
> 
> See [`meteor-vite`](https://github.com/JorgenVatle/meteor-vite) for more details and examples.

## Installation
```shell
meteor npm i @meteor-vite/react-meteor-data
```

## Usage
The API is exactly the same as Meteor's [`react-meteor-data`](https://github.com/meteor/react-packages/tree/master/packages/react-meteor-data) package.
Just replace your `meteor/react-meteor-data` imports with `@meteor-vite/react-meteor-data`

```tsx
import { Meteor } from 'meteor/meteor';
import { useTracker } from '@meteor-vite/react-meteor-data';

export function UserID() {
    const user = useTracker(() => Meteor.user(), []);
    return (<div>User ID: { user._id }</div>)
}
```

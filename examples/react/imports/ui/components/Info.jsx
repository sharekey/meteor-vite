import React, { useState } from 'react';
import { useFind, useSubscribe } from '@meteor-vite/react-meteor-data';
import { LinksCollection } from '../../api/links/links';
import { Meteor } from 'meteor/meteor';

export const Info = () => {
    try {
        const isLoading = useSubscribe('links');
        const links = useFind(() => LinksCollection.find());
        const form = new class {
            _initialState = {
                title: '',
                url: '',
            }
            constructor() {
                const [data, setState] = useState(this._initialState);
                this._setState = setState;
                this.data = data;
            }
            async submit(event) {
                event.preventDefault();
                await Meteor.callAsync('links.create', this.data);
                this._setState(this._initialState);
            }
            setData(field) {
                if (!(field in this.data)) {
                    throw new Error('Unknown field provided!');
                }
                return (event) => { this._setState({...this.data, [field]: event.target.value}) };
            }
        }
        if (isLoading()) {
            return <div>Loading...</div>;
        }

        return (
            <div class="grid gap-4">
                <div class="py-6 ">
                    <h2 class="text-2xl font-semibold pb-4">Learn Meteor!</h2>
                    <ul class="grid gap-2 max-h-[35vh] overflow-y-auto">{links.map(
                        link => <li class="flex gap-4" key={link._id}>
                            <span class="opacity-50">-</span> <a href={link.url} target="_blank">{link.title}</a>
                        </li>,
                    )}</ul>
                </div>

                <div>
                    <h3 class="text-xl font-semibold pb-2">Add resources</h3>
                    <p class="text-slate-400 text-sm">Enter some URLs to test functionality</p>
                </div>

                <form class="grid gap-4" onSubmit={e => form.submit(e)}>
                    <label class="flex items-center gap-6">
                        <span class="font-semibold">Title</span>
                        <input class="flex-grow" name="title" value={form.data.title} onChange={form.setData('title')} placeholder="My awesome resource.." />
                    </label>
                    <label class="flex items-center gap-6">
                        <span class="font-semibold">URL</span>
                        <input class="flex-grow"  name="url" value={form.data.url} onChange={form.setData('url')} placeholder="http://examp.." />
                    </label>

                    <button type="submit">Add</button>
                </form>
            </div>
        );

    } catch (error) {
        return (
            <div>
                <h1>Exception while calling React Meteor Data</h1>
                <p>
                    Todo: Vite and Meteor's React versions appear to be slightly different. Importing React with CJS
                    syntax seems to resolve the issue.
                </p>
                <pre>{error.stack}</pre>
            </div>
        );
    }
};

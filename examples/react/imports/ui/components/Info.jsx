import React from 'react';
import { useFind, useSubscribe } from '@meteor-vite/react-meteor-data';
import { LinksCollection } from '../../api/links/links';
import { Meteor } from 'meteor/meteor';

export const Info = () => {
    try {
        const isLoading = useSubscribe('links');
        const links = useFind(() => LinksCollection.find());
        const form = new class {
            data = {
                title: '',
                url: '',
            }
            async submit(event) {
                event.preventDefault();
                await Meteor.callAsync('links.create', this.data);
            }
            setData(field) {
                if (!field in this.data) {
                    throw new Error('Unknown field provided!');
                }
                return (event) => this.data[field] = event.target.value;
            }
        }
        if (isLoading()) {
            return <div>Loading...</div>;
        }

        return (
            <div>
                <h2>Learn Meteor!</h2>
                <ul>{links.map(
                    link => <li key={link._id}>
                        <a href={link.url} target="_blank">{link.title}</a>
                    </li>,
                )}</ul>
                <h3>Add resources</h3>
                <form onSubmit={e => form.submit(e)}>
                    <label>
                        Title
                        <input name="title" onChange={form.setData('title')} placeholder="My awesome resource.." />
                    </label>
                    <label>
                        URL
                        <input name="url" onChange={form.setData('url')} placeholder="http://examp.." />
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

import { Mongo } from 'meteor/mongo';

export const ChatCollection = new Mongo.Collection<ChatDocument>('chat');

export interface ChatDocument {
    _id: string;
    content: string;
    createdAt: Date;
}
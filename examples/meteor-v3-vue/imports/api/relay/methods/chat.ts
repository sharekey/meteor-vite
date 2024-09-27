import { createMethod } from 'meteor/zodern:relay';
import { z } from 'zod';
import { ChatCollection } from '../../chat/collection';

export const sendMessage = createMethod({
    name: 'sendMessage',
    schema: z.object({
        content: z.string(),
    }),
    run({ content }) {
        return ChatCollection.insertAsync({
            content,
            createdAt: new Date(),
        });
    }
});
import { getStateId as getViteStateId } from '@meteor-vite/test-externalization';
import { getStateId as getMeteorStateId } from 'meteor/test:duplicate-npm-dependencies';
import { describe, expect, it } from 'ts-minitest';

export default () => describe('Meteor and npm dependencies', () => {
    it('shares the same internal state', () => {
        expect(getViteStateId()).toBe(getMeteorStateId())
    })
})
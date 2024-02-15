import { describe, expect, it } from 'ts-minitest';
import { getStateId as getViteStateId } from 'test-externalization';
import { getStateId as getMeteorStateId } from 'meteor/test:duplicate-npm-dependencies';

export default () => describe('Meteor and npm dependencies', () => {
    it('shares the same internal state', () => {
        expect(getViteStateId()).toBe(getMeteorStateId())
    })
})
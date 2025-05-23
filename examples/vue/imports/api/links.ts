import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

export interface Link {
  _id?: string
  title: string
  url: string
  createdAt: Date
}

export const LinksCollection = new Mongo.Collection<Link>('links')

Meteor.methods({
  async 'links.insert'(title: string, url: string) {
    await LinksCollection.insertAsync({
      title,
      url,
      createdAt: new Date(),
    })
  },
})

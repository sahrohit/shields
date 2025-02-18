import Joi from 'joi'
import { metric } from '../text-formatters.js'
import { BaseJsonService, InvalidResponse, NotFound } from '../index.js'

const schema = Joi.object({
  entities: Joi.object({
    user: Joi.object()
      .required()
      .pattern(/^\w+$/, {
        points: Joi.number().allow(null).required(),
      }),
  }).optional(),
}).required()

/**
 * This badge displays the total number of points a student has accumulated
 * from completing challenges on freeCodeCamp.
 */
export default class FreeCodeCampPoints extends BaseJsonService {
  static category = 'other'
  static route = {
    base: 'freecodecamp/points',
    pattern: ':username',
  }

  static examples = [
    {
      title: 'freeCodeCamp points',
      namedParams: { username: 'sethi' },
      staticPreview: this.render({ points: 934 }),
    },
  ]

  static defaultBadgeData = { label: 'points', color: 'info' }

  static render({ points }) {
    return { message: metric(points) }
  }

  async fetch({ username }) {
    return this._requestJson({
      schema,
      url: `https://api.freecodecamp.org/api/users/get-public-profile`,
      options: {
        qs: {
          username,
        },
      },
    })
  }

  static transform(response, username) {
    const { entities } = response

    if (entities === undefined)
      throw new NotFound({ prettyMessage: 'profile not found' })

    const { points } = entities.user[username]

    if (points === null) throw new InvalidResponse({ prettyMessage: 'private' })

    return points
  }

  async handle({ username }) {
    const response = await this.fetch({ username })
    const points = this.constructor.transform(response, username)
    return this.constructor.render({ points })
  }
}

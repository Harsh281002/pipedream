const twitter = require('https://github.com/PipedreamHQ/pipedream/components/twitter/twitter.app.js')
const moment = require('moment')
 
module.exports = {
  name: "user-tweets", 
  version: "0.0.1",
  props: { 
    db: "$.service.db",
    twitter,
    screen_name: { 
      propDefinition: [twitter, "from"],
      label: 'Username', 
    }, 
    includeRetweets: { propDefinition: [twitter, "includeRetweets"] },
    includeReplies: { propDefinition: [twitter, "includeReplies"] },
    enrichTweets: { propDefinition: [twitter, "enrichTweets"] },
    count: { propDefinition: [twitter, "count"] },
    timer: {
      type: "$.interface.timer",
      default: {
        intervalSeconds: 60 * 15,
      },
    },
  }, 
  methods: {},
  async run(event) {
    const screen_name = this.screen_name //.replace('@','')
    const since_id = this.db.get("since_id")
    const { enrichTweets, includeReplies, includeRetweets, count } = this
    let max_id

    if(!includeReplies) {
      exclude_replies = true
    } else {
      exclude_replies = false
    }
    include_rts = includeRetweets

    console.log(screen_name)
    const tweets = await this.twitter.getUserTimeline({
      screen_name,
      enrichTweets, 
      exclude_replies,
      include_rts, 
      count,
      since_id,
    }) 

    console.log(tweets)

    // emit array of tweet objects
    if(tweets.length > 0) {
      tweets.sort(function(a, b){return a.id - b.id})

      tweets.forEach(tweet => {
        this.$emit(tweet, {
          ts: moment(tweet.created_at, 'ddd MMM DD HH:mm:ss Z YYYY').valueOf(),
          summary: tweet.full_text || tweet.text,
          id: tweet.id_str,
        })

        if (!max_id || tweet.id_str > max_id) {
          max_id = tweet.id_str
        }
      })
    }
    if (max_id) {
      this.db.set("since_id", max_id)
    }
  },
}
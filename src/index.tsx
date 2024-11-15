import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'
import { isValidDuration, parseDurationToTimestamp } from '../lib/utils.js'
import { addReminder, startReminderService } from '../lib/db.js';
import { neynar } from 'frog/middlewares'

const neynarMiddleware = neynar({
  apiKey: process.env.NEYNAR_API_KEY!,
  features: ['interactor', 'cast'],
})

// import { neynar } from 'frog/hubs'

export const app = new Frog({
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' }),
  title: 'Frog Frame',
})

app.frame('/', (c) => {
  return c.res({
    image: (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          width: '100%',
          height: '100%',
          backgroundColor: 'black',
          position: 'relative'
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          Remind me of this cast in
        </div>
      </div>
    ),
    intents: [
      <TextInput placeholder="e.g. 1d 12h 25m" />,
      <Button value="share">Share</Button>,
      <Button action="/submit">Remind me</Button>,
    ],
  })
})

// @ts-ignore
app.frame("/submit", neynarMiddleware, async (c) => {
  const { inputText, frameData } = c

  if (!inputText) return c.error({
    message: "Please input a time"
  })

  if (!isValidDuration(inputText)) return c.error({
    message: "Invalid duration format. Use format like '1d 12h 25m', '3h 30m', or '45m'"
  })

  const timestamp = parseDurationToTimestamp(inputText)

  // Store the reminder in Postgres
  await addReminder(
    frameData!.castId.hash,
    frameData!.fid.toString(),
    c.var.cast?.author.username!,
    timestamp
  )

  return c.res({
    image: (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          width: '100%',
          height: '100%',
          backgroundColor: 'black',
          position: 'relative'
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          {/* Set reminder for {new Date(timestamp * 1000).toLocaleString()}! */}
          Success!
        </div>
      </div>
    ),
    intents: [
      <Button value="share">Share</Button>,
      <Button action="/">Go back</Button>,
    ],
  })
})

app.use('/*', serveStatic({ root: './public' }))
devtools(app, { serveStatic })
startReminderService();

if (typeof Bun !== 'undefined') {
  Bun.serve({
    fetch: app.fetch,
    port: 3000,
  })
  console.log('Server is running on port 3000')
}

import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'
import { isValidDuration, parseDurationToTimestamp } from '../lib/utils.js'
import { addReminder, startReminderService } from '../lib/db.js';

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
          alignItems: 'center',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
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
          Remind me of this cast
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
app.frame("/submit", async (c) => {
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
    frameData!.castId.toString(),
    frameData!.fid.toString(),
    timestamp
  )

  return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
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
          Good job
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

if (typeof Bun !== 'undefined') {
  startReminderService();
  Bun.serve({
    fetch: app.fetch,
    port: 3000,
  })
  console.log('Server is running on port 3000')
}

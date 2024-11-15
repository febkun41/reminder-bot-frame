import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'
import { isValidDuration, parseDurationToTimestamp } from '../lib/utils.js'
import { addReminder, startReminderService } from '../lib/db.js';
import { neynar as neynarHub } from 'frog/hubs'
import { neynar } from 'frog/middlewares'
import { shareComposeUrl } from '../lib/constants.js';

const neynarMiddleware = neynar({
  apiKey: process.env.NEYNAR_API_KEY!,
  features: ['interactor', 'cast'],
})

type State = {
  timestamp: number | null
}

export const app = new Frog({
  hub: neynarHub({ apiKey: process.env.NEYNAR_API_KEY! }),
  title: "Cast Reminder Bot",
  verify: "silent",
  initialState: {
    timestamp: null
  }
})

app.frame('/', (c) => {
  return c.res({
    image: (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "black",
        color: "white",
        fontSize: 60,
      }}>
        <span>Remind me of this cast in</span>
      </div>
    ),
    intents: [
      <TextInput placeholder="e.g. 1d 12h 25m" />,
      <Button.Link href={shareComposeUrl}>Share</Button.Link>,
      <Button action="/confirm">Submit</Button>,
    ],
  })
})

app.frame("/confirm", async (c) => {
  const { inputText, deriveState } = c

  if (!inputText) return c.error({
    message: "Please input a time"
  })

  if (!isValidDuration(inputText)) return c.error({
    message: "Invalid duration format. Use format like '1d 12h 25m', '3h 30m', or '45m'"
  })

  const timestamp = parseDurationToTimestamp(inputText!)

  const state = deriveState((previousState: any) => {
    previousState.timestamp = timestamp
  })

  const dateString = new Date(timestamp * 1000).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });

  return c.res({
    image: (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "black",
        color: "white",
        fontSize: 60,
        padding: "10rem",
        textAlign: "center",
      }}>
        @reminderbot will send you this cast on {dateString}
      </div>
    ),
    intents: [
      <Button action="/">Go back</Button>,
      <Button action="/submit">Confirm</Button>,
    ],
  })
})

// @ts-ignore
app.frame("/submit", neynarMiddleware, async (c) => {
  const { frameData, previousState }: any = c

  // Store the reminder in Postgres
  await addReminder(
    frameData!.castId.hash,
    frameData!.fid.toString(),
    c.var.cast?.author.username!,
    previousState?.timestamp
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
          Success!
        </div>
      </div>
    ),
    intents: [
      <Button.Link href={shareComposeUrl}>Share</Button.Link>,
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

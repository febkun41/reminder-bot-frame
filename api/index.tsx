import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import { isValidDuration, parseDurationToTimestamp } from '../lib/utils.js'
import { addReminder } from '../lib/db.js';
import { neynar as neynarHub } from 'frog/hubs'
import { neynar } from 'frog/middlewares'
import { SHARE_URL } from '../lib/constants.js';

const neynarMiddleware = neynar({
  apiKey: process.env.NEYNAR_API_KEY!,
  features: ['interactor', 'cast'],
})

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  hub: neynarHub({ apiKey: process.env.NEYNAR_API_KEY! }),
  title: "Reminder Bot",
  verify: "silent",
  initialState: {
    timestamp: null
  },
  imageOptions: {
		fonts: [{ name: "Inter", weight: 500, source: "google" }],
	},
})

app.castAction(
  '/',
  (c) => {
    return c.frame({
      path: "/input"
    })
  },
  { 
    aboutUrl: 'https://warpcast.com/reminderbot',
    name: 'Reminder Bot',
    description: 'Set up reminders for any cast as direct messages from @reminderbot.',
    icon: 'bell'
  }
) 

const baseContainerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  backgroundColor: "black",
  color: "white",
}

app.frame('/input', (c) => {
  return c.res({
    image: (
      <div style={{
        ...baseContainerStyle,
        fontSize: 60,
      }}>
        Set a reminder for this cast in
      </div>
    ),
    intents: [
      <TextInput placeholder="e.g. 1d 12h 25m" />,
      <Button.Link href={SHARE_URL}>Share</Button.Link>,
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

  deriveState((previousState: any) => {
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
        ...baseContainerStyle,
        flexDirection: "column",
        padding: "10rem",
        textAlign: "center",
      }}>
        <div style={{ display: "flex", fontSize: 60 }}>
          Confirm time: {dateString} UTC
        </div>
        <div style={{ display: "flex", fontSize: 32, marginTop: "5rem" }}>
          @reminderbot will send you this cast as a direct message.
        </div>
      </div>
    ),
    intents: [
      <Button action="/input">Go back</Button>,
      <Button action="/submit">Confirm</Button>,
    ],
  })
})

// @ts-ignore
app.frame("/submit", neynarMiddleware, async (c) => {
  const { frameData, previousState }: any = c

  await addReminder(
    frameData!.castId.hash,
    frameData!.fid.toString(),
    c.var.cast?.author.username!,
    previousState?.timestamp
  )

  return c.res({
    image: (
      <div style={{
        ...baseContainerStyle,
        flexDirection: "column",
        flexWrap: "nowrap",
        position: "relative"
      }}>
        <div style={{
          fontSize: 60,
          fontStyle: "normal",
          letterSpacing: "-0.025em",
          lineHeight: 1.4,
          marginTop: 30,
          padding: "0 120px",
          whiteSpace: "pre-wrap",
        }}>
          Success!
        </div>
      </div>
    ),
    intents: [
      <Button.Link href={SHARE_URL}>Share</Button.Link>,
      <Button action="/input">Go back</Button>,
    ],
  })
})

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== 'undefined'
const isProduction = isEdgeFunction || import.meta.env?.MODE !== 'development'
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic })


export const GET = handle(app)
export const POST = handle(app)


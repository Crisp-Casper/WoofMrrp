# Channel Inactivity

A Vencord userplugin that sends one randomly selected message after a configurable
period without messages from other users in a chosen channel. Messages sent by
you—including its own—do not reset or trigger the timer.

Copy this repository's `index.ts` into a `channelInactivity` folder under
Vencord's `src/userplugins` directory, rebuild Vencord, then enable
**ChannelInactivity** in settings. Configure the target channel ID, inactivity
period (default: 5 minutes), and one candidate message per line in the plugin
settings.
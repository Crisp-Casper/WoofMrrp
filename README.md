# Channel Inactivity

A Vencord userplugin that sends one randomly selected message after a configurable
period without new messages in a chosen channel. Its own message does not restart
the timer; a new channel message begins the next inactivity period.

Copy this repository's `index.ts` into a `channelInactivity` folder under
Vencord's `src/userplugins` directory, rebuild Vencord, then enable
**ChannelInactivity** in settings. Configure the target channel ID, inactivity
period (default: 5 minutes), and one candidate message per line in the plugin
settings.
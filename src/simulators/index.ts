import type { EmailClient } from '../types'
import type { Simulator } from './types'
import { gmailWebSimulator } from './gmailWeb'
import { gmailIosSimulator } from './gmailIos'
import { gmailAndroidSimulator } from './gmailAndroid'
import { outlookDesktopSimulator } from './outlookDesktop'
import { outlookComSimulator } from './outlookCom'
import { outlookMobileSimulator } from './outlookMobile'
import { appleMailSimulator } from './appleMail'
import { outlookMacSimulator } from './outlookMac'
import { yahooMailSimulator } from './yahooMail'

export const SIMULATORS: Record<EmailClient, Simulator> = {
  'gmail-web':       gmailWebSimulator,
  'gmail-ios':       gmailIosSimulator,
  'gmail-android':   gmailAndroidSimulator,
  'outlook-desktop': outlookDesktopSimulator,
  'outlook-com':     outlookComSimulator,
  'outlook-mobile':  outlookMobileSimulator,
  'apple-mail':      appleMailSimulator,
  'outlook-mac':     outlookMacSimulator,
  'yahoo-mail':      yahooMailSimulator,
}

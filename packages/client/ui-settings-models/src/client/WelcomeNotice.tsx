/** Product-wide, versioned internal-testing notice. */

import { useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { BrandWordmark, Button, OnboardingSurface } from '@deepseek-ai/dsh-client-ui-primitives'
import type { WelcomeNoticeState, WelcomeNoticeStore } from './welcome-store.ts'
import type { en } from './locales.ts'
import css from './WelcomeNotice.module.css'

const DEEPSEEK_HARNESS_URL = 'https://www.deepseek.com/harness/'

/** Registration-side dependencies of {@link WelcomeNotice}. */
export interface WelcomeNoticeInjected {
  hooks: {
    /** Durable or process-local acknowledgement state. */
    welcome: SnapshotStore<WelcomeNoticeState>
  }
  /** Welcome acknowledgement controller. */
  controller: WelcomeNoticeStore
  /** Onboarding copy. */
  t: (key: keyof typeof en) => string
}

/** Coordinator owner props plus this step's injected face. */
export type WelcomeNoticeProps =
  PropsRuntime<'settings.onboarding'> & InjectFace<WelcomeNoticeInjected>

/**
 * Render the current notice until its exact copy version is acknowledged.
 * @param props - settings-shell owner state and welcome dependencies.
 * @returns the welcome modal or null while the step decides not to show.
 */
export function WelcomeNotice(props: WelcomeNoticeProps): ReactNode {
  const { complete, controller, useWelcome, t } = props
  const state = useWelcome(snapshot => snapshot)
  const finished = useRef(false)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const finish = useCallback((): void => {
    if (finished.current) return
    finished.current = true
    complete()
  }, [complete])

  useEffect(() => {
    if (state.status === 'idle') void controller.load()
  }, [controller, state.status])

  useEffect(() => {
    if (state.acknowledged) finish()
  }, [finish, state.acknowledged])

  useEffect(() => {
    if (state.status === 'ready' && !state.acknowledged) titleRef.current?.focus()
  }, [state.acknowledged, state.status])

  if (state.status === 'idle' || state.status === 'loading' || state.acknowledged) return null

  const acknowledge = async (): Promise<void> => {
    if (await controller.acknowledge()) finish()
  }
  const paragraphs = t('welcomeBody').split('\n\n')

  return (
    <OnboardingSurface>
      <section
        className={css.welcome}
        role="dialog"
        aria-modal="true"
        aria-label={t('welcomeTitle')}
      >
        <header className={css.header}>
          <BrandWordmark className={css.wordmark} size={30} />
          <span className={css.desktopBadge}>DSH Desktop</span>
        </header>

        <div className={css.layout}>
          <div className={css.intro}>
            <p className={css.eyebrow}>{t('welcomeEyebrow')}</p>
            <h2 id="dsh-welcome-title" ref={titleRef} className={css.title} tabIndex={-1}>
              {t('welcomeHero')}
            </h2>
            <div className={css.copy}>
              {paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            </div>

            <div className={css.features}>
              <article className={css.featureCard}>
                <h3>{t('welcomeLocalTitle')}</h3>
                <p>{t('welcomeLocalBody')}</p>
              </article>
              <article className={css.featureCard}>
                <h3>{t('welcomeOpenTitle')}</h3>
                <p>{t('welcomeOpenBody')}</p>
              </article>
            </div>
          </div>

          <aside className={css.actionCard}>
            <p className={css.actionKicker}>{t('welcomeTitle')}</p>
            <h3>{t('welcomePanelTitle')}</h3>
            <p className={css.actionBody}>{t('welcomePanelBody')}</p>
            {state.error === null ? null : <p className={css.error} role="alert">{t('welcomeError')}</p>}
            <div className={css.actions}>
              <Button
                variant="primary"
                className={css.primary}
                disabled={state.status === 'saving'}
                onClick={() => { void acknowledge() }}
              >
                {t('welcomeContinue')}
              </Button>
              <a
                className={css.harnessLink}
                href={DEEPSEEK_HARNESS_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('welcomeHarnessLink')}
              </a>
            </div>
          </aside>
        </div>
      </section>
    </OnboardingSurface>
  )
}

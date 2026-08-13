/** Durable settings namespace for product-wide GUI onboarding facts. */
export const WELCOME_NOTICE_SETTINGS_NAMESPACE = 'ui-onboarding'

/** Field storing the last welcome notice version the user acknowledged. */
export const WELCOME_NOTICE_ACK_FIELD = 'welcomeNoticeVersion'

/**
 * Bump only when the notice changes materially and every user should see it
 * again. The acknowledgement is compared for exact equality.
 */
export const WELCOME_NOTICE_VERSION = '2026-08-14.1'

/** The complete editable internal-testing notice in both supported GUI locales. */
export const WELCOME_NOTICE_COPY = {
  zh: {
    title: '欢迎使用 DSH Desktop',
    body: 'DSH 是 DeepSeek Harness 的简称。DSH Desktop 是由社区维护的桌面版本，让 DeepSeek Harness 在 Windows 上开箱即用。\n\nDeepSeek Harness 0.1 仍处于快速迭代阶段，核心插件与基础 API 可能持续演进。欢迎开发者体验并反馈。',
    continueLabel: '开始配置',
  },
  en: {
    title: 'Welcome to DSH Desktop',
    body: 'DSH is short for DeepSeek Harness. DSH Desktop is a community-maintained desktop edition that makes DeepSeek Harness ready to use on Windows.\n\nDeepSeek Harness 0.1 is evolving quickly, and its core plugins and foundational APIs may continue to change. Developer feedback is welcome.',
    continueLabel: 'Start setup',
  },
} as const

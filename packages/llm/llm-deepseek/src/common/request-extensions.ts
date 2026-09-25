/** Prepare plugin-contributed request fields and commit their delivery after HTTP acceptance. */

import { LlmError } from '@deepseek-ai/dsh-llm'
import type { DeepSeekLlmApiExtensionRequest, PreparedDeepSeekLlmApiExtensions } from '@deepseek-ai/dsh-deepseek-llm-api-extensions'
import type { DeepSeekAdapterOptions } from './types.ts'

/**
 * Merge contributions without replacing protocol-owned fields. Preparation and
 * acceptance failures retain the same error category across DeepSeek protocols.
 * If adding fields makes the body unserializable, send the base body and leave
 * the contribution unaccepted so the registry can offer it on a later request.
 * @param body - serialized protocol request before extension fields.
 * @param options - request identity, purpose, and cancellation.
 * @param prepare - contributor registry captured for this adapter.
 * @param onOmitted - optional diagnostic for fields left unaccepted after a serialization fallback.
 * @returns HTTP payload and a commit to invoke only after a successful HTTP response.
 */
export async function prepareRequestExtensions(
  body: DeepSeekLlmApiExtensionRequest['body'],
  options: Omit<DeepSeekLlmApiExtensionRequest, 'body'>,
  prepare: DeepSeekAdapterOptions['prepareExtensions'],
  onOmitted?: (fields: readonly string[], error: unknown) => void,
): Promise<{ payload: string; accept(): Promise<void> }> {
  let extensions: PreparedDeepSeekLlmApiExtensions
  try {
    extensions = await prepare({ body, ...options })
  } catch (error) {
    throw new LlmError('DeepSeek request extension preparation failed', 'REQUEST_EXTENSION', { cause: error })
  }
  const fields = Object.keys(extensions.fields)
  for (const field of fields) {
    if (Object.hasOwn(body, field)) {
      throw new LlmError(`DeepSeek request extension field ${JSON.stringify(field)} collides with the base request`, 'REQUEST_EXTENSION')
    }
  }
  let payload: string
  try {
    payload = JSON.stringify({ ...body, ...extensions.fields })
  } catch (error: unknown) {
    const basePayload = JSON.stringify(body)
    onOmitted?.(fields, error)
    return { payload: basePayload, accept: () => Promise.resolve() }
  }
  return {
    payload,
    async accept() {
      try {
        await extensions.accept()
      } catch (error) {
        throw new LlmError('DeepSeek request extension acceptance failed', 'REQUEST_EXTENSION', { cause: error })
      }
    },
  }
}

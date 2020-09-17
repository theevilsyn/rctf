import { MergeExclusive } from 'type-fest'
import { useCallback } from 'react'
import useAuth from '../util/auth'
import { uri, fetcher } from './util'

export class ResponseError extends Error {
  responseKind: string
  responseMessage: string

  constructor(responseKind: string, responseMessage: string) {
    super(responseMessage)
    this.responseKind = responseKind
    this.responseMessage = responseMessage
  }
}

type ApiMutation<Params, Response> = (
  params: Params
) => Promise<{ data: Response } | { error: ResponseError }>

export interface AuthLoginTeamTokenRequest {
  teamToken: string
}
export interface AuthLoginCtftimeTokenRequest {
  ctftimeToken: string
}
export type AuthLoginRequest = MergeExclusive<
  AuthLoginTeamTokenRequest,
  AuthLoginCtftimeTokenRequest
>
export interface AuthLoginResponse {
  authToken: string
}

export interface AuthRecoverRequest {
  email: string
}

interface AuthRegisterBaseRequest {
  name: string
}
export interface AuthRegisterEmailRequest extends AuthRegisterBaseRequest {
  email: string
}
export interface AuthRegisterCtftimeTokenRequest
  extends AuthRegisterBaseRequest {
  ctftimeToken: string
}
export type AuthRegisterRequest = MergeExclusive<
  AuthRegisterEmailRequest,
  AuthRegisterCtftimeTokenRequest
>
export interface AuthRegisterRegisterResponse {
  kind: 'goodRegister'
  authToken: string
}
export interface AuthRegisterSentResponse {
  kind: 'goodVerifySent'
}
export type AuthRegisterResponse =
  | AuthRegisterRegisterResponse
  | AuthRegisterSentResponse

export interface AuthVerifyRequest {
  verifyToken: string
}
export interface AuthVerifyRegisterResponse {
  kind: 'goodRegister'
  authToken: string
}
export interface AuthVerifyRecoverResponse {
  kind: 'goodVerify'
  authToken: string
}
export interface AuthVerifyUpdateResponse {
  kind: 'goodEmailSet'
}
export type AuthVerifyResponse =
  | AuthVerifyRegisterResponse
  | AuthVerifyRecoverResponse
  | AuthVerifyUpdateResponse

export interface ChallsSubmitRequest {
  challId: string
  flag: string
}

export interface CtftimeCallbackRequest {
  ctftimeCode: string
}
export interface CtftimeCallbackResponse {
  ctftimeToken: string
  ctftimeName: string
  ctftimeId: string
}

export interface UsersMeAuthCtftimePutRequest {
  ctftimeToken: string
}

export interface UsersMeAuthEmailPutRequest {
  email: string
}
export interface UsersMeAuthEmailPutResponse {
  kind: 'goodEmailSet' | 'goodVerifySent'
}

export const useAuthLogin = (): ApiMutation<
  AuthLoginRequest,
  AuthLoginResponse
> =>
  useCallback(async body => {
    const { kind, message, data } = await fetcher({
      path: 'auth/login',
      method: 'POST',
      body,
    })
    if (kind === 'goodLogin') {
      return { data: data as AuthLoginResponse }
    }
    return { error: new ResponseError(kind, message) }
  }, [])

export const useAuthRecover = (): ApiMutation<AuthRecoverRequest, true> =>
  useCallback(async body => {
    const { kind, message } = await fetcher({
      path: 'auth/recover',
      method: 'POST',
      body,
    })
    if (kind === 'goodVerifySent') {
      return { data: true }
    }
    return { error: new ResponseError(kind, message) }
  }, [])

export const useAuthRegister = (): ApiMutation<
  AuthRegisterRequest,
  AuthRegisterResponse
> =>
  useCallback(async body => {
    const { kind, message, data } = await fetcher({
      path: 'auth/register',
      method: 'POST',
      body,
    })
    if (kind === 'goodRegister') {
      return {
        data: {
          kind,
          authToken: (data as AuthRegisterRegisterResponse).authToken,
        },
      }
    }
    if (kind === 'goodVerifySent') {
      return { data: { kind } }
    }
    return { error: new ResponseError(kind, message) }
  }, [])

export const useAuthVerify = (): ApiMutation<
  AuthVerifyRequest,
  AuthVerifyResponse
> =>
  useCallback(async body => {
    const { kind, message, data } = await fetcher({
      path: 'auth/verify',
      method: 'POST',
      body,
    })
    if (kind === 'goodRegister') {
      return {
        data: {
          kind,
          authToken: (data as AuthVerifyRegisterResponse).authToken,
        },
      }
    }
    if (kind === 'goodVerify') {
      return {
        data: {
          kind,
          authToken: (data as AuthVerifyRecoverResponse).authToken,
        },
      }
    }
    if (kind === 'goodEmailSet') {
      return { data: { kind } }
    }
    return { error: new ResponseError(kind, message) }
  }, [])

export const useChallsSubmit = (): ApiMutation<ChallsSubmitRequest, true> => {
  const { authToken } = useAuth()
  return useCallback(
    async ({ challId, flag }) => {
      const { kind, message } = await fetcher({
        path: uri`challs/${challId}/submit`,
        method: 'POST',
        authToken,
        body: {
          flag,
        },
      })
      if (kind === 'goodFlag') {
        return { data: true }
      }
      return { error: new ResponseError(kind, message) }
    },
    [authToken]
  )
}

export const useCtftimeCallback = (): ApiMutation<
  CtftimeCallbackRequest,
  CtftimeCallbackResponse
> =>
  useCallback(async body => {
    const { kind, message, data } = await fetcher({
      path: 'integrations/ctftime/callback',
      method: 'POST',
      body,
    })
    if (kind === 'goodCtftimeToken') {
      return { data: data as CtftimeCallbackResponse }
    }
    return { error: new ResponseError(kind, message) }
  }, [])

export const useUsersMeAuthCtftimePut = (): ApiMutation<
  UsersMeAuthCtftimePutRequest,
  true
> => {
  const { authToken } = useAuth()
  return useCallback(
    async body => {
      const { kind, message } = await fetcher({
        path: 'users/me/auth/ctftime',
        method: 'PUT',
        authToken,
        body,
      })
      if (kind === 'goodCtftimeAuthSet') {
        return { data: true }
      }
      return { error: new ResponseError(kind, message) }
    },
    [authToken]
  )
}

export const useUsersMeAuthCtftimeDelete = (): ApiMutation<void, true> => {
  const { authToken } = useAuth()
  return useCallback(async () => {
    const { kind, message } = await fetcher({
      path: 'users/me/auth/ctftime',
      method: 'DELETE',
      authToken,
    })
    if (kind === 'goodCtftimeRemoved') {
      return { data: true }
    }
    return { error: new ResponseError(kind, message) }
  }, [authToken])
}

export const useUsersMeAuthEmailPut = (): ApiMutation<
  UsersMeAuthEmailPutRequest,
  UsersMeAuthEmailPutResponse
> => {
  const { authToken } = useAuth()
  return useCallback(
    async body => {
      const { kind, message } = await fetcher({
        path: 'users/me/auth/email',
        method: 'PUT',
        authToken,
        body,
      })
      if (kind === 'goodEmailSet' || kind === 'goodVerifySent') {
        return { data: { kind } }
      }
      return { error: new ResponseError(kind, message) }
    },
    [authToken]
  )
}

export const useUsersMeAuthEmailDelete = (): ApiMutation<void, true> => {
  const { authToken } = useAuth()
  return useCallback(async () => {
    const { kind, message } = await fetcher({
      path: 'users/me/auth/email',
      method: 'DELETE',
      authToken,
    })
    if (kind === 'goodEmailRemoved') {
      return { data: true }
    }
    return { error: new ResponseError(kind, message) }
  }, [authToken])
}